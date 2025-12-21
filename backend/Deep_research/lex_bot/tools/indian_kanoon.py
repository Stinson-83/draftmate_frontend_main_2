"""
Indian Kanoon Scraper - Web scraping for case law

Features:
- Rate-limited scraping (configurable delay)
- Search and extract case details
- Full judgment text extraction
"""

import time
import re
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus, urljoin

import requests
from bs4 import BeautifulSoup
import trafilatura

from lex_bot.config import SCRAPE_DELAY_SECONDS
from lex_bot.core.tool_registry import register_tool

logger = logging.getLogger(__name__)

BASE_URL = "https://indiankanoon.org"
SEARCH_URL = f"{BASE_URL}/search/?formInput="


class IndianKanoonScraper:
    """
    Web scraper for Indian Kanoon case law database.
    
    Usage:
        scraper = IndianKanoonScraper()
        results = scraper.search("Kesavananda Bharati")
        full_text = scraper.get_judgment("12345")
    """
    
    def __init__(self, delay_seconds: float = None):
        """
        Initialize scraper with rate limiting.
        
        Args:
            delay_seconds: Delay between requests. Defaults to config.
        """
        self.delay = delay_seconds or SCRAPE_DELAY_SECONDS
        self.last_request_time = 0
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })
    
    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.delay:
            sleep_time = self.delay - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def _fetch_page(self, url: str) -> Optional[str]:
        """Fetch a page with rate limiting."""
        self._rate_limit()
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None
    
    def search(
        self,
        query: str,
        max_results: int = 10,
        include_snippet: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search Indian Kanoon for cases.
        
        Args:
            query: Search query
            max_results: Maximum results to return
            include_snippet: Whether to include text snippets
            
        Returns:
            List of search result dicts
        """
        encoded_query = quote_plus(query)
        url = f"{SEARCH_URL}{encoded_query}"
        
        logger.info(f"🔍 Searching Indian Kanoon: {query}")
        
        html = self._fetch_page(url)
        if not html:
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        
        # Find result items
        result_divs = soup.find_all('div', class_='result')
        
        for div in result_divs[:max_results]:
            try:
                result = self._parse_result(div, include_snippet)
                if result:
                    results.append(result)
            except Exception as e:
                logger.warning(f"Failed to parse result: {e}")
                continue
        
        logger.info(f"Found {len(results)} results")
        return results
    
    def _parse_result(self, div, include_snippet: bool) -> Optional[Dict[str, Any]]:
        """Parse a single search result div."""
        # Title and link
        title_elem = div.find('a', class_='result_title') or div.find('a')
        if not title_elem:
            return None
        
        title = title_elem.get_text(strip=True)
        href = title_elem.get('href', '')
        
        # Extract doc ID from URL
        doc_id = ""
        if '/doc/' in href:
            doc_id = href.split('/doc/')[-1].rstrip('/')
        
        full_url = urljoin(BASE_URL, href)
        
        # Citation (often in a specific element or title)
        citation = ""
        cite_elem = div.find('span', class_='cite')
        if cite_elem:
            citation = cite_elem.get_text(strip=True)
        
        # Snippet
        snippet = ""
        if include_snippet:
            snippet_elem = div.find('div', class_='result_text') or div.find('p')
            if snippet_elem:
                snippet = snippet_elem.get_text(strip=True)[:500]
        
        # Court and date extraction from title
        court = ""
        date = ""
        
        # Common pattern: "Case Name ... Court Name on Date"
        date_match = re.search(r'on\s+(\d{1,2}\s+\w+,?\s+\d{4})', title)
        if date_match:
            date = date_match.group(1)
        
        # Court detection
        court_patterns = [
            (r'Supreme Court', 'Supreme Court of India'),
            (r'High Court', 'High Court'),
            (r'District Court', 'District Court'),
            (r'Tribunal', 'Tribunal'),
        ]
        for pattern, court_name in court_patterns:
            if re.search(pattern, title, re.IGNORECASE):
                court = court_name
                break
        
        return {
            "title": title,
            "url": full_url,
            "doc_id": doc_id,
            "citation": citation,
            "snippet": snippet,
            "court": court,
            "date": date,
            "source": "Indian Kanoon",
        }
    
    def get_judgment(self, doc_id: str, max_chars: int = 50000) -> Optional[Dict[str, Any]]:
        """
        Fetch full judgment text by document ID.
        
        Args:
            doc_id: Indian Kanoon document ID
            max_chars: Maximum characters to return
            
        Returns:
            Dict with judgment text and metadata
        """
        url = f"{BASE_URL}/doc/{doc_id}/"
        
        logger.info(f"📄 Fetching judgment: {doc_id}")
        
        html = self._fetch_page(url)
        if not html:
            return None
        
        # Use trafilatura for clean text extraction
        text = trafilatura.extract(html, favor_precision=True)
        
        if not text:
            # Fallback to BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            judgment_div = soup.find('div', class_='judgments') or soup.find('div', class_='doc')
            if judgment_div:
                text = judgment_div.get_text(separator='\n', strip=True)
        
        if text and len(text) > max_chars:
            text = text[:max_chars] + "\n\n[... truncated ...]"
        
        # Extract title
        soup = BeautifulSoup(html, 'html.parser')
        title_elem = soup.find('h2') or soup.find('title')
        title = title_elem.get_text(strip=True) if title_elem else f"Document {doc_id}"
        
        return {
            "doc_id": doc_id,
            "title": title,
            "text": text or "",
            "url": url,
            "source": "Indian Kanoon",
        }
    
    def run(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Main entry point for tool usage.
        
        Args:
            query: Search query
            max_results: Maximum results
            
        Returns:
            List of search results
        """
        return self.search(query, max_results=max_results)


# Register with tool registry
@register_tool(
    name="indian_kanoon",
    capabilities=["case_search", "judgment_lookup", "web_scrape"],
    description="Search and retrieve case law from Indian Kanoon",
    requires_rate_limit=True,
)
class IndianKanoonTool(IndianKanoonScraper):
    """Registered version of IndianKanoonScraper for tool registry."""
    pass


# Convenience function
def search_indian_kanoon(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Quick search on Indian Kanoon."""
    scraper = IndianKanoonScraper()
    return scraper.search(query, max_results=max_results)
