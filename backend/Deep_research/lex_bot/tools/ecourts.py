"""
eCourts Search Tool - Query Indian eCourts judgment portal

Features:
- Search judgments from various Indian courts
- Filter by court type, case type, year, act, section
- Rate-limited requests
"""

import time
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

from lex_bot.config import SCRAPE_DELAY_SECONDS
from lex_bot.core.tool_registry import register_tool

logger = logging.getLogger(__name__)

BASE_URL = "https://judgments.ecourts.gov.in"
SEARCH_URL = f"{BASE_URL}/pdfsearch/"


class ECourtsSearchTool:
    """
    Search tool for eCourts Judgment Portal.
    
    Usage:
        tool = ECourtsSearchTool()
        results = tool.search(query="murder", court_type="supreme_court")
    """
    
    def __init__(self, delay_seconds: float = None):
        """
        Initialize eCourts search tool.
        
        Args:
            delay_seconds: Delay between requests for rate limiting.
        """
        self.delay = delay_seconds or SCRAPE_DELAY_SECONDS
        self.last_request_time = 0
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
        })
    
    def _rate_limit(self):
        """Enforce rate limiting."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self.last_request_time = time.time()
    
    def _fetch_page(self, url: str, params: Dict = None) -> Optional[str]:
        """Fetch a page with rate limiting."""
        self._rate_limit()
        try:
            response = self.session.get(url, params=params, timeout=15)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logger.error(f"eCourts fetch failed: {e}")
            return None
    
    def search(
        self,
        query: str = None,
        court_type: str = None,
        case_type: str = None,
        year: int = None,
        act: str = None,
        section: str = None,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search eCourts judgment portal.
        
        Args:
            query: Free text search query
            court_type: "supreme_court", "high_court", "district_court"
            case_type: Type of case
            year: Year of judgment
            act: Act name to filter by
            section: Section number to filter by
            max_results: Maximum results to return
            
        Returns:
            List of judgment results
        """
        logger.info(f"🔍 Searching eCourts: {query or 'all'}")
        
        # Note: eCourts portal has complex form submission
        # This is a simplified implementation
        params = {}
        if query:
            params['free_text'] = query
        if case_type:
            params['case_type'] = case_type
        if year:
            params['year'] = str(year)
        if act:
            params['act'] = act
        if section:
            params['section'] = section
        
        html = self._fetch_page(SEARCH_URL, params)
        if not html:
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        
        # Parse results - this depends on actual portal structure
        # Simplified parsing for demonstration
        result_rows = soup.find_all('tr', class_='result-row') or soup.find_all('div', class_='judgment-item')
        
        for row in result_rows[:max_results]:
            try:
                result = self._parse_result(row)
                if result:
                    results.append(result)
            except Exception as e:
                logger.warning(f"Failed to parse eCourts result: {e}")
                continue
        
        logger.info(f"Found {len(results)} eCourts results")
        return results
    
    def _parse_result(self, element) -> Optional[Dict[str, Any]]:
        """Parse a single result element."""
        # Find title/case name
        title_elem = element.find('a') or element.find('td', class_='case-title')
        if not title_elem:
            return None
        
        title = title_elem.get_text(strip=True)
        href = title_elem.get('href', '') if title_elem.name == 'a' else ''
        
        # Try to extract metadata
        court = ""
        date = ""
        case_no = ""
        
        # Look for metadata fields
        for cell in element.find_all(['td', 'span', 'div']):
            text = cell.get_text(strip=True)
            if 'court' in cell.get('class', []) or 'Court' in text:
                court = text
            elif 'date' in cell.get('class', []):
                date = text
            elif 'case' in cell.get('class', []) and 'No' in text:
                case_no = text
        
        return {
            "title": title,
            "url": href if href.startswith('http') else f"{BASE_URL}{href}" if href else "",
            "court": court,
            "date": date,
            "case_number": case_no,
            "source": "eCourts",
        }
    
    def get_courts_list(self) -> List[Dict[str, str]]:
        """Get list of available courts."""
        return [
            {"code": "supreme_court", "name": "Supreme Court of India"},
            {"code": "high_court", "name": "High Courts"},
            {"code": "district_court", "name": "District Courts"},
            {"code": "tribunal", "name": "Tribunals"},
        ]
    
    def run(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Main entry point for tool usage."""
        return self.search(query=query, max_results=max_results)


# Register with tool registry
@register_tool(
    name="ecourts",
    capabilities=["case_search", "judgment_lookup", "court_records"],
    description="Search eCourts judgment portal",
    requires_rate_limit=True,
)
class ECourtsTool(ECourtsSearchTool):
    """Registered version for tool registry."""
    pass


# Convenience function
def search_ecourts(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Quick search on eCourts."""
    tool = ECourtsSearchTool()
    return tool.search(query=query, max_results=max_results)
