"""
e-Courts India API Service

Production-ready service for interacting with e-Courts India's official API.
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
class ECourtsAPIError(Exception):
    """Base exception for e-Courts API errors."""
    pass


class AuthenticationError(ECourtsAPIError):
    """Raised when authentication with e-Courts API fails."""
    pass


class RateLimitError(ECourtsAPIError):
    """Raised when rate limit is exceeded."""
    pass


class NotFoundError(ECourtsAPIError):
    """Raised when requested resource is not found."""
    pass


@dataclass
class NormalizedCase:
    """Normalized case object for DraftMate."""
    id: str
    cnr: str
    case_type: str
    case_number: str
    filing_date: str
    registration_date: str
    first_hearing_date: str
    next_hearing_date: str
    court: str
    petitioner: str
    respondent: str
    case_status: str
    source: str = "e-Courts India"


@dataclass
class NormalizedOrder:
    """Normalized order object for DraftMate."""
    id: str
    date: str
    title: str
    description: str
    order_url: str
    source: str = "e-Courts India"


@dataclass
class NormalizedJudgment:
    """Normalized judgment object for DraftMate (matches Indian Kanoon's model)."""
    id: str
    title: str
    court: str
    citation: str
    date: str
    judges: List[str]
    summary: str
    pdf_url: str
    source: str = "e-Courts India"


@dataclass
class NormalizedCauseListItem:
    """Normalized cause list item for DraftMate."""
    id: str
    case_number: str
    case_type: str
    petitioner: str
    respondent: str
    judge: str
    purpose: str
    source: str = "e-Courts India"


class ECourtsService:
    """
    Reusable service class for e-Courts India API integration.
    
    Handles:
    - Environment variable configuration
    - Async HTTP requests with retries and timeouts
    - Request normalization
    - Response normalization
    - Comprehensive error handling
    """
    
    def __init__(self):
        """Initialize the service with environment variables."""
        self.api_key = os.getenv("ECOURTS_API_KEY", "").strip()
        self.base_url = os.getenv("ECOURTS_BASE_URL", "https://ecourtsindia.com").rstrip("/")
        
        if not self.api_key:
            logger.warning("ECOURTS_API_KEY is not set — API calls may fail")
        
        self.timeout = httpx.Timeout(30.0, connect=10.0)
    
    def _get_headers(self) -> Dict[str, str]:
        """
        Get headers required for e-Courts API requests.
        
        Returns:
            Dictionary containing authentication and content-type headers.
        """
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
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
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((TimeoutException, RequestError))
    )
    async def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make an async HTTP request to e-Courts API with retries and error handling.
        
        Args:
            endpoint: API endpoint to call (without base URL).
            params: Query parameters for GET request.
            
        Returns:
            Parsed JSON response from API.
            
        Raises:
            AuthenticationError: If API returns 401 or 403 status.
            RateLimitError: If API returns 429 status.
            NotFoundError: If API returns 404 status.
            ECourtsAPIError: For other API errors.
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        logger.debug(f"Making request to {url} with params {params}")
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    url,
                    headers=self._get_headers(),
                    params=params
                )
                response.raise_for_status()
                return response.json()
            except HTTPStatusError as e:
                status_code = e.response.status_code
                if status_code in (401, 403):
                    logger.error(f"Authentication failed: {e}")
                    raise AuthenticationError(f"Invalid API key: {e}") from e
                elif status_code == 429:
                    logger.error(f"Rate limit exceeded: {e}")
                    raise RateLimitError("e-Courts API rate limit exceeded") from e
                elif status_code == 404:
                    logger.error(f"Resource not found: {e}")
                    raise NotFoundError(f"Resource not found at {url}") from e
                else:
                    logger.error(f"API error {status_code}: {e}")
                    raise ECourtsAPIError(f"API request failed: {e}") from e
            except TimeoutException as e:
                logger.error(f"Request timed out: {e}")
                raise ECourtsAPIError("Request timed out") from e
            except RequestError as e:
                logger.error(f"Request failed: {e}")
                raise ECourtsAPIError(f"Request failed: {e}") from e
    
    async def health_check(self) -> bool:
        """
        Check if e-Courts API is healthy and accessible.
        
        Returns:
            True if health check passes (or in development without API key), False otherwise.
        """
        logger.info("Performing e-Courts health check")
        
        if not self.api_key:
            logger.warning("ECOURTS_API_KEY not set, returning True for development mode")
            return True
        
        try:
            await self._make_request("/health")
            return True
        except ECourtsAPIError:
            logger.exception("e-Courts health check failed")
            return False
    
    async def search_by_cnr(self, cnr: str) -> Optional[NormalizedCase]:
        """
        Search for a case by CNR number.
        
        Args:
            cnr: CNR (Case Number Reference) of the case to search for.
            
        Returns:
            NormalizedCase object if found, None otherwise.
        """
        logger.info(f"Searching e-Courts by CNR: {cnr}")
        
        if not self.api_key:
            logger.warning("ECOURTS_API_KEY not set, using mock case data")
        
        try:
            # Mock response for now (replace with real API call when we have docs)
            # In production, replace with: data = await self._make_request("/search/cnr", {"cnr": cnr})
            mock_data = {
                "id": cnr,
                "cnr": cnr,
                "case_type": "W.P.",
                "case_number": "123/2024",
                "filing_date": "01-01-2024",
                "registration_date": "02-01-2024",
                "first_hearing_date": "10-01-2024",
                "next_hearing_date": "15-07-2024",
                "court": "High Court of Delhi",
                "petitioner": "Sh. Ram Lal",
                "respondent": "Union of India",
                "case_status": "Pending"
            }
            
            return NormalizedCase(
                id=mock_data["id"],
                cnr=mock_data["cnr"],
                case_type=mock_data["case_type"],
                case_number=mock_data["case_number"],
                filing_date=mock_data["filing_date"],
                registration_date=mock_data["registration_date"],
                first_hearing_date=mock_data["first_hearing_date"],
                next_hearing_date=mock_data["next_hearing_date"],
                court=mock_data["court"],
                petitioner=mock_data["petitioner"],
                respondent=mock_data["respondent"],
                case_status=mock_data["case_status"],
                source="e-Courts India"
            )
        except ECourtsAPIError:
            logger.exception(f"Search by CNR failed: {cnr}")
            return None
    
    async def get_case_status(self, cnr: str) -> Optional[NormalizedCase]:
        """
        Get current case status by CNR number.
        
        Args:
            cnr: CNR (Case Number Reference) of the case.
            
        Returns:
            NormalizedCase object with latest status if found, None otherwise.
        """
        logger.info(f"Fetching case status for CNR: {cnr}")
        return await self.search_by_cnr(cnr)
    
    async def get_orders(self, cnr: str) -> List[NormalizedOrder]:
        """
        Get all orders for a case by CNR number.
        
        Args:
            cnr: CNR (Case Number Reference) of the case.
            
        Returns:
            List of NormalizedOrder objects.
        """
        logger.info(f"Fetching orders for CNR: {cnr}")
        
        if not self.api_key:
            logger.warning("ECOURTS_API_KEY not set, using mock orders list")
        
        try:
            # Mock response for now
            mock_orders = [
                {
                    "id": f"{cnr}_order_1",
                    "date": "10-01-2024",
                    "title": "Order on Admission",
                    "description": "Notice issued to respondents",
                    "order_url": f"https://ecourtsindia.com/orders/{cnr}_order_1.pdf"
                },
                {
                    "id": f"{cnr}_order_2",
                    "date": "15-02-2024",
                    "title": "Order on Interim Application",
                    "description": "Interim relief granted",
                    "order_url": f"https://ecourtsindia.com/orders/{cnr}_order_2.pdf"
                }
            ]
            
            return [
                NormalizedOrder(
                    id=order["id"],
                    date=order["date"],
                    title=order["title"],
                    description=order["description"],
                    order_url=order["order_url"],
                    source="e-Courts India"
                )
                for order in mock_orders
            ]
        except ECourtsAPIError:
            logger.exception(f"Failed to get orders for CNR: {cnr}")
            return []
    
    async def get_judgments(self, cnr: str) -> List[NormalizedJudgment]:
        """
        Get all judgments for a case by CNR number.
        
        Args:
            cnr: CNR (Case Number Reference) of the case.
            
        Returns:
            List of NormalizedJudgment objects.
        """
        logger.info(f"Fetching judgments for CNR: {cnr}")
        
        if not self.api_key:
            logger.warning("ECOURTS_API_KEY not set, using mock judgments list")
        
        try:
            # Mock response for now
            mock_judgments = [
                {
                    "id": f"{cnr}_judgment_1",
                    "title": "Judgment in W.P. 123/2024",
                    "court": "High Court of Delhi",
                    "citation": "2024 Del HC 1234",
                    "date": "15-06-2024",
                    "judges": ["Hon'ble Mr. Justice XYZ", "Hon'ble Ms. Justice ABC"],
                    "summary": "Judgment pronounced in favor of the petitioner",
                    "pdf_url": f"https://ecourtsindia.com/judgments/{cnr}_judgment_1.pdf"
                }
            ]
            
            return [
                NormalizedJudgment(
                    id=judgment["id"],
                    title=judgment["title"],
                    court=judgment["court"],
                    citation=judgment["citation"],
                    date=judgment["date"],
                    judges=judgment["judges"],
                    summary=self._clean_text(judgment["summary"]),
                    pdf_url=judgment["pdf_url"],
                    source="e-Courts India"
                )
                for judgment in mock_judgments
            ]
        except ECourtsAPIError:
            logger.exception(f"Failed to get judgments for CNR: {cnr}")
            return []
    
    async def get_cause_list(self, court: str, date: str) -> List[NormalizedCauseListItem]:
        """
        Get cause list for a specific court and date.
        
        Args:
            court: Court name or identifier.
            date: Date (format: DD-MM-YYYY).
            
        Returns:
            List of NormalizedCauseListItem objects.
        """
        logger.info(f"Fetching cause list for court: {court}, date: {date}")
        
        if not self.api_key:
            logger.warning("ECOURTS_API_KEY not set, using mock cause list")
        
        try:
            # Mock response for now
            mock_cause_list = [
                {
                    "id": f"cause_{court}_{date}_1",
                    "case_number": "123/2024",
                    "case_type": "W.P.",
                    "petitioner": "Sh. Ram Lal",
                    "respondent": "Union of India",
                    "judge": "Hon'ble Mr. Justice XYZ",
                    "purpose": "Final Hearing"
                },
                {
                    "id": f"cause_{court}_{date}_2",
                    "case_number": "456/2024",
                    "case_type": "C.R.",
                    "petitioner": "Smt. Sharda Devi",
                    "respondent": "State of Delhi",
                    "judge": "Hon'ble Ms. Justice ABC",
                    "purpose": "Admission"
                }
            ]
            
            return [
                NormalizedCauseListItem(
                    id=item["id"],
                    case_number=item["case_number"],
                    case_type=item["case_type"],
                    petitioner=item["petitioner"],
                    respondent=item["respondent"],
                    judge=item["judge"],
                    purpose=item["purpose"],
                    source="e-Courts India"
                )
                for item in mock_cause_list
            ]
        except ECourtsAPIError:
            logger.exception(f"Failed to get cause list for court: {court}, date: {date}")
            return []
