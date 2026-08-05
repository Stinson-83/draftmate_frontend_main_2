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
from dotenv import load_dotenv

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
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env')
        load_dotenv(env_path)
        load_dotenv()

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
        Strip HTML tags, embedded CSS/JS code blocks, and site header boilerplate.
        """
        if not text:
            return ""
        
        # 1. Remove script, style, header, nav, footer tags and their contents
        text = re.sub(r"(?i)<script[\s\S]*?</script>", " ", text)
        text = re.sub(r"(?i)<style[\s\S]*?</style>", " ", text)
        text = re.sub(r"(?i)<noscript[\s\S]*?</noscript>", " ", text)
        text = re.sub(r"(?i)<header[\s\S]*?</header>", " ", text)
        text = re.sub(r"(?i)<nav[\s\S]*?</nav>", " ", text)

        # 2. Remove all remaining HTML tags
        text = re.sub(r"<[^>]+>", " ", text)

        # 3. Remove leftover CSS code blocks or variable declarations
        text = re.sub(r"(?i):\s*root\s*\{[^}]*\}", " ", text)
        text = re.sub(r"(?i)@[a-z-]+\s+[^{]+\{[^}]*\}", " ", text)
        text = re.sub(r"(?i)(\.[a-zA-Z0-9_-]+|\#[a-zA-Z0-9_-]+)\s*\{[^}]*\}", " ", text)
        text = re.sub(r"(?i)--[a-zA-Z0-9_-]+:\s*[^;\}]+;?", " ", text)

        # 4. Remove website header & navigation boilerplate
        boilerplate = [
            r"(?i)Skip to main content",
            r"(?i)Indian Kanoon\s*-\s*Search engine for Indian Law",
            r"(?i)Search laws,\s*court judgments and everything",
            r"(?i)Unlock Advanced Research with PRISM",
            r"(?i)Free features\s+Premium\s+Prism AI\s+IKademy\s+Pricing\s+Login",
            r"(?i)Mobile Navigation",
            r"(?i)Know your Kanoon",
            r"(?i)Doc Gen Hub",
            r"(?i)Counter Argument",
            r"(?i)Case Predict AI",
            r"(?i)Talk with IK Doc",
            r"(?i)Tools for analyzing structure and cite text of judgments",
            r"(?i)Get in PDF",
            r"(?i)Print it!",
            r"(?i)Download Court Copy"
        ]
        for pat in boilerplate:
            text = re.sub(pat, " ", text)

        # 5. Normalize whitespace
        text = re.sub(r"\s+", " ", text)
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
    
    async def _search_serper_kanoon(self, query: str) -> List[NormalizedJudgment]:
        """
        Fallback search method using Serper API targeting Indian Kanoon live documents
        when the official API token returns 403 / 401 / 429 or is unconfigured.
        """
        serper_key = os.getenv("SERPER_API_KEY", "").strip()
        if not serper_key:
            return []

        search_q = f"site:indiankanoon.org/doc/ {query}".strip()
        url = "https://google.serper.dev/search"
        headers = {
            "X-API-KEY": serper_key,
            "Content-Type": "application/json"
        }
        payload = {"q": search_q, "num": 10}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code != 200:
                    logger.warning(f"Serper API request returned status: {res.status_code}")
                    return []
                
                data = res.json()
                organics = data.get("organic", [])
                results = []

                for item in organics:
                    link = item.get("link", "")
                    match = re.search(r"indiankanoon\.org/doc/(\d+)", link)
                    if not match:
                        continue
                    
                    doc_id = match.group(1)
                    raw_title = item.get("title", "Untitled Judgment")
                    clean_title = re.sub(r"\s*-\s*Indian Kanoon.*$", "", raw_title, flags=re.IGNORECASE).strip()
                    snippet = item.get("snippet", "")
                    date_str = item.get("date", "")

                    court = "Supreme Court of India"
                    if "High Court" in raw_title or "High Court" in snippet:
                        court = "High Court"
                    elif "Tribunal" in raw_title or "CAT" in raw_title:
                        court = "Tribunal"

                    results.append(NormalizedJudgment(
                        id=doc_id,
                        title=clean_title,
                        court=court,
                        citation=f"IK Doc #{doc_id}",
                        date=date_str,
                        judges=[],
                        summary=self._clean_text(snippet),
                        pdf_url=f"https://indiankanoon.org/doc/{doc_id}/",
                        source="Indian Kanoon"
                    ))

                return results
        except Exception as e:
            logger.warning(f"Serper Kanoon fallback search error: {e}")
            return []

    async def search_judgments(self, query: str, page: int = 1) -> List[NormalizedJudgment]:
        """
        Search for judgments on Indian Kanoon with live API + Serper Web fallback.
        """
        logger.info(f"Searching Indian Kanoon for: {query[:100]} (page: {page})")
        
        results = []
        if self.api_token:
            try:
                data = await self._make_request(
                    "/search/",
                    data={"formInput": query, "pagenum": page - 1}
                )
                docs = data.get("docs", [])
                normalized = [self._normalize_judgment(doc) for doc in docs]
                results = [j for j in normalized if self._is_clean_judgment(j)]
            except Exception as e:
                logger.warning(f"Official Kanoon API search failed ({e}), switching to real-time Web/Serper provider...")

        # Fallback to real-time live Indian Kanoon results via Serper Web API
        if not results:
            results = await self._search_serper_kanoon(query)

        logger.info(f"Returning {len(results)} clean results for query: {query[:100]}")
        return results

    async def get_document(self, doc_id: str) -> Optional[str]:
        """
        Get the full text of a document (judgment).
        """
        logger.info(f"Fetching document: {doc_id}")
        
        if self.api_token:
            try:
                data = await self._make_request(f"/doc/{doc_id}/")
                text = data.get("doc", "") or data.get("text", "")
                if text:
                    return self._clean_text(text)
            except Exception as e:
                logger.warning(f"Official API get_document failed for {doc_id}: {e}, falling back to web fetch...")

        try:
            url = f"https://indiankanoon.org/doc/{doc_id}/"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=headers, follow_redirects=True)
                if res.status_code == 200:
                    return self._clean_text(res.text)
        except Exception as web_err:
            logger.error(f"Web fetch for doc {doc_id} failed: {web_err}")

        return None

    async def get_document_pdf(self, doc_id: str, pdf_type: str = "pdf") -> Optional[bytes]:
        """
        Fetch official PDF bytes for a document from Indian Kanoon server-to-server.
        """
        logger.info(f"Fetching PDF for document ID: {doc_id} (type: {pdf_type})")
        url = f"https://indiankanoon.org/doc/{doc_id}/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Referer": url
        }

        try:
            async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
                res1 = await client.get(url, headers=headers)
                if res1.status_code != 200:
                    logger.warning(f"Initial doc fetch for PDF returned status {res1.status_code}")
                    return None

                match = re.search(r'name=["\']csrfmiddlewaretoken["\'] value=["\']([^"\']+)["\']', res1.text)
                csrf_token = match.group(1) if match else ""

                data = {
                    "type": pdf_type,
                }
                if csrf_token:
                    data["csrfmiddlewaretoken"] = csrf_token

                res2 = await client.post(url, data=data, headers=headers)
                content_type = res2.headers.get("content-type", "").lower()
                
                if res2.status_code == 200 and ("application/pdf" in content_type or res2.content.startswith(b"%PDF")):
                    logger.info(f"Successfully fetched PDF for doc {doc_id} (size: {len(res2.content)} bytes)")
                    return res2.content
                else:
                    logger.warning(f"PDF POST request returned status {res2.status_code}, content-type: {content_type}")
        except Exception as e:
            logger.error(f"Failed to fetch PDF for doc {doc_id}: {e}")

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
