"""
Indian Kanoon API Service

Production-ready service for interacting with Indian Kanoon's official API.
Provides normalized response formats and includes error handling, retries, and logging.
"""

import os
import logging
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

import httpx
from httpx import HTTPStatusError, TimeoutException, RequestError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Configure logging
logger = logging.getLogger(__name__)


# Custom exceptions
class IndianKanoonAPIError(Exception):
    """Base exception for Indian Kanoon API errors."""
    pass


class AuthenticationError(IndianKanoonAPIError):
    """Raised when authentication with Indian Kanoon API fails."""
    pass


class RateLimitError(IndianKanoonAPIError):
    """Raised when rate limit is exceeded."""
    pass


class NotFoundError(IndianKanoonAPIError):
    """Raised when requested resource is not found."""
    pass


@dataclass
class NormalizedJudgment:
    """Normalized judgment object for DraftMate."""
    id: str
    title: str
    court: str
    citation: str
    date: str
    judges: List[str]
    summary: str
    pdf_url: str
    source: str = "Indian Kanoon"


class IndianKanoonService:
    """
    Reusable service class for Indian Kanoon API integration.
    
    Handles:
    - Environment variable configuration
    - Async HTTP requests with retries and timeouts
    - Request normalization
    - Response normalization
    - Comprehensive error handling
    """
    
    def __init__(self):
        """Initialize the service with environment variables."""
        self.api_token = (os.getenv("INDIANKANOON_API_TOKEN", "") or os.getenv("IKApi", "")).strip()
        self.base_url = os.getenv("INDIANKANOON_BASE_URL", "https://api.indiankanoon.org").rstrip("/")
        
        if not self.api_token:
            logger.warning("INDIANKANOON_API_TOKEN is not set — API calls may fail")
        
        self.timeout = httpx.Timeout(30.0, connect=10.0)
    
    def _get_headers(self) -> Dict[str, str]:
        """
        Get headers required for Indian Kanoon API requests.
        
        Returns:
            Dictionary containing authentication and content-type headers.
        """
        return {
            "Authorization": f"Token {self.api_token}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
    
    def _clean_text(self, text: str) -> str:
        """
        Strip HTML tags and clean up whitespace from text.
        
        Args:
            text: Raw text from API response (may contain HTML).
            
        Returns:
            Cleaned plain text.
        """
        if not text:
            return ""
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s{2,}", " ", text)
        return text.strip()
    
    def _normalize_judgment(self, doc: Dict[str, Any]) -> NormalizedJudgment:
        """
        Convert raw Indian Kanoon API response to normalized DraftMate object.
        
        Args:
            doc: Raw document dictionary from Indian Kanoon API.
            
        Returns:
            NormalizedJudgment object.
        """
        # Court code mapping from Indian Kanoon's API
        COURT_CODE_MAPPING = {
            "1000": "Supreme Court of India",
            "11": "High Court of Delhi",
            "14": "Constitution of India"
        }
        
        doc_id = str(doc.get("tid", doc.get("docid", "")))
        court_code = doc.get("court", doc.get("doctype", ""))
        court = COURT_CODE_MAPPING.get(str(court_code), str(court_code))
        
        return NormalizedJudgment(
            id=doc_id,
            title=doc.get("title", "Untitled Judgment"),
            court=court,
            citation=doc.get("citation", ""),
            date=doc.get("publishdate", ""),
            judges=[],  # Indian Kanoon API doesn't always return judges
            summary=self._clean_text(doc.get("headline", "")),
            pdf_url=f"https://indiankanoon.org/doc/{doc_id}/",
            source="Indian Kanoon"
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((TimeoutException, RequestError))
    )
    async def _make_request(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make an async HTTP request to Indian Kanoon API with retries and error handling.
        
        Args:
            endpoint: API endpoint to call (without base URL).
            data: Form data to send in POST request.
            
        Returns:
            Parsed JSON response from API.
            
        Raises:
            AuthenticationError: If API returns 401 or 403 status.
            RateLimitError: If API returns 429 status.
            NotFoundError: If API returns 404 status.
            IndianKanoonAPIError: For other API errors.
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        logger.debug(f"Making request to {url}")
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    data=data
                )
                response.raise_for_status()
                return response.json()
            except HTTPStatusError as e:
                status_code = e.response.status_code
                if status_code in (401, 403):
                    logger.error(f"Authentication failed: {e}")
                    raise AuthenticationError(f"Invalid API token: {e}") from e
                elif status_code == 429:
                    logger.error(f"Rate limit exceeded: {e}")
                    raise RateLimitError("Indian Kanoon API rate limit exceeded") from e
                elif status_code == 404:
                    logger.error(f"Resource not found: {e}")
                    raise NotFoundError(f"Resource not found at {url}") from e
                else:
                    logger.error(f"API error {status_code}: {e}")
                    raise IndianKanoonAPIError(f"API request failed: {e}") from e
            except TimeoutException as e:
                logger.error(f"Request timed out: {e}")
                raise IndianKanoonAPIError("Request timed out") from e
            except RequestError as e:
                logger.error(f"Request failed: {e}")
                raise IndianKanoonAPIError(f"Request failed: {e}") from e
    
    async def search_judgments(self, query: str, page: int = 1) -> List[NormalizedJudgment]:
        """
        Search for judgments on Indian Kanoon.
        
        Args:
            query: Search query string.
            page: Page number for pagination (default: 1).
            
        Returns:
            List of normalized judgment objects.
        """
        logger.info(f"Searching Indian Kanoon for: {query[:100]} (page: {page})")
        
        if not self.api_token:
            logger.warning("INDIANKANOON_API_TOKEN not set, returning empty list")
            return []
        
        try:
            data = await self._make_request(
                "/search/",
                data={"formInput": query, "pagenum": page - 1}
            )
            
            docs = data.get("docs", [])
            normalized = [self._normalize_judgment(doc) for doc in docs]
            filtered = [j for j in normalized if self._is_clean_judgment(j)]
            
            logger.info(f"Found {len(normalized)} raw results, returning {len(filtered)} clean results for query: {query[:100]}")
            return filtered
        except IndianKanoonAPIError:
            logger.exception(f"Search failed for query: {query[:100]}")
            return []
    
    async def get_document(self, doc_id: str) -> Optional[str]:
        """
        Get the full text of a document (judgment).
        
        Args:
            doc_id: Indian Kanoon document ID.
            
        Returns:
            Cleaned full text of the document, or None on failure.
        """
        logger.info(f"Fetching document: {doc_id}")
        
        if not self.api_token:
            logger.warning("INDIANKANOON_API_TOKEN not set, returning None")
            return None
        
        try:
            data = await self._make_request(f"/doc/{doc_id}/")
            text = data.get("doc", "") or data.get("text", "")
            return self._clean_text(text)
        except IndianKanoonAPIError:
            logger.exception(f"Failed to get document: {doc_id}")
            return None
    
    async def get_document_metadata(self, doc_id: str) -> Optional[NormalizedJudgment]:
        """
        Get metadata for a specific document without fetching full text.
        
        First tries to search for the document by ID, if that fails, try to 
        fetch the document and see if we can get any metadata (if available),
        or create a basic metadata object.
        
        Args:
            doc_id: Indian Kanoon document ID.
            
        Returns:
            Normalized judgment object with metadata, or None on failure.
        """
        logger.info(f"Fetching metadata for document: {doc_id}")
        
        if not self.api_token:
            logger.warning("INDIANKANOON_API_TOKEN not set, returning None")
            return None
        
        try:
            # First, try multiple search strategies
            search_queries = [
                doc_id,
                f'"{doc_id}"',
                f"doc:{doc_id}"
            ]
            
            for query in search_queries:
                results = await self.search_judgments(query, page=1)
                for result in results:
                    if str(result.id) == str(doc_id):
                        return result
            
            # If search fails, create a basic metadata object (since we at least have the doc ID)
            logger.warning(f"Could not find full metadata for doc ID {doc_id}, creating basic metadata")
            return NormalizedJudgment(
                id=str(doc_id),
                title=f"Judgment {doc_id}",
                court="Unknown Court",
                citation="",
                date="",
                judges=[],
                summary="",
                pdf_url=f"https://indiankanoon.org/doc/{doc_id}/"
            )
        except IndianKanoonAPIError:
            logger.exception(f"Failed to get metadata for document: {doc_id}")
            # Even if there's an error, create basic metadata
            return NormalizedJudgment(
                id=str(doc_id),
                title=f"Judgment {doc_id}",
                court="Unknown Court",
                citation="",
                date="",
                judges=[],
                summary="",
                pdf_url=f"https://indiankanoon.org/doc/{doc_id}/"
            )
    
    async def search_by_citation(self, citation: str) -> List[NormalizedJudgment]:
        """
        Search for judgments by citation.
        
        Args:
            citation: Citation string to search for.
            
        Returns:
            List of normalized judgment objects.
        """
        logger.info(f"Searching by citation: {citation}")
        return await self.search_judgments(f'citation:"{citation}"', page=1)
    
    async def search_by_act(self, act_name: str) -> List[NormalizedJudgment]:
        """
        Search for judgments related to a specific act.
        
        Args:
            act_name: Name of the act to search for.
            
        Returns:
            List of normalized judgment objects.
        """
        logger.info(f"Searching by act: {act_name}")
        return await self.search_judgments(act_name, page=1)

    def _is_clean_judgment(self, j: NormalizedJudgment) -> bool:
        """
        Check if a normalized judgment has clean, readable titles and summaries.
        Filters out entries corrupted by incorrect PDF extraction or RTF tags.
        """
        title = j.title or ""
        summary = j.summary or ""
        
        # Check for RTF/formatting tags or consecutive hashes/symbols that show corruption
        corruption_patterns = ["#CJ##", "aJ#####", "h8kT#", "##aJ", "###", "C.J.#", "a.J.#"]
        for pattern in corruption_patterns:
            if pattern in title or pattern in summary:
                return False
                
        # Check for excessive corrupted characters (like Latin-1 symbols or control chars) in title
        # Allow spaces, standard alphanumeric, standard English punctuation
        clean_chars_count = sum(1 for c in title if c.isalnum() or c.isspace() or c in ".,-()[]/\":';&_@*+?!=%")
        total_chars = len(title)
        if total_chars > 0 and (clean_chars_count / total_chars) < 0.9:
            return False
            
        return True
