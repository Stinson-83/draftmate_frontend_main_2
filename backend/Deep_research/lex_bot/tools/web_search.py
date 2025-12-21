import logging
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Tuple, Optional
import trafilatura
from tavily import TavilyClient
from duckduckgo_search import DDGS
from lex_bot.config import (
    TAVILY_API_KEY, SERPER_API_KEY, GOOGLE_SERP_API_KEY,
    FIRECRAWL_API_KEY, WEB_SEARCH_MAX_RESULTS, PREFERRED_DOMAINS
)

# Configure logging
logger = logging.getLogger(__name__)

class WebSearchTool:
    def __init__(self):
        self.tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None
        self.serper_key = SERPER_API_KEY
        self.google_serp_key = GOOGLE_SERP_API_KEY
        self.firecrawl = None
        if FIRECRAWL_API_KEY:
            try:
                from firecrawl import FirecrawlApp
                self.firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
            except:
                logger.warning("Could not initialize Firecrawl.")

    def _ddgs_search(self, query: str, max_results: int, domains: List[str] = None) -> List[Dict]:
        try:
            target_domains = domains if domains else PREFERRED_DOMAINS
            # Create site: operators
            domain_filter = " OR ".join(f"site:{d}" for d in target_domains)
            full_query = f"{query} ({domain_filter})"
            
            res = []
            with DDGS() as ddgs:
                results = ddgs.text(full_query, max_results=max_results)
                for r in results:
                    res.append({
                        "title": r.get('title', 'Unknown'),
                        "url": r.get('href', ''),
                        "snippet": r.get('body', '')
                    })
            return res
        except Exception as e:
            logger.error(f"DDG Failed: {e}")
            return []

    def _tavily_search(self, query: str, max_results: int, domains: List[str] = None) -> List[Dict]:
        if not self.tavily_client:
            return []
        try:
            target_domains = domains if domains else PREFERRED_DOMAINS
            # Tavily 'include_domains' logic
            # Tavily has a generic limit around 400 chars for the 'query' param in some tiers
            # Truncating to be safe
            if len(query) > 400:
                safe_query = query[:390]
            else:
                safe_query = query
            response = self.tavily_client.search(
                query=safe_query,
                search_depth="advanced",
                max_results=max_results,
                include_domains=target_domains
            )
            res = []
            for r in response.get('results', []):
                res.append({
                    "title": r.get('title', 'Unknown'),
                    "url": r.get('url', ''),
                    "snippet": r.get('content', '')
                })
            return res
        except Exception as e:
            logger.error(f"Tavily Failed: {e}")
            return []

    def _serper_search(self, query: str, max_results: int, domains: List[str] = None) -> List[Dict]:
        """Serper.dev search fallback"""
        if not self.serper_key:
            return []
        try:
            headers = {"X-API-KEY": self.serper_key, "Content-Type": "application/json"}
            payload = {"q": query, "num": max_results}
            
            # Add site filter if domains specified
            if domains:
                site_filter = " OR ".join(f"site:{d}" for d in domains[:5])
                payload["q"] = f"{query} ({site_filter})"
            
            response = requests.post(
                "https://google.serper.dev/search",
                headers=headers,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            res = []
            for r in data.get("organic", []):
                res.append({
                    "title": r.get("title", "Unknown"),
                    "url": r.get("link", ""),
                    "snippet": r.get("snippet", "")
                })
            return res
        except Exception as e:
            logger.error(f"Serper Failed: {e}")
            return []

    def _google_serp_search(self, query: str, max_results: int, domains: List[str] = None) -> List[Dict]:
        """Google SERP API fallback (SerpAPI or similar)"""
        if not self.google_serp_key:
            return []
        try:
            params = {
                "api_key": self.google_serp_key,
                "q": query,
                "num": max_results,
                "engine": "google"
            }
            
            response = requests.get(
                "https://serpapi.com/search",
                params=params,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            res = []
            for r in data.get("organic_results", []):
                res.append({
                    "title": r.get("title", "Unknown"),
                    "url": r.get("link", ""),
                    "snippet": r.get("snippet", "")
                })
            return res
        except Exception as e:
            logger.error(f"Google SERP Failed: {e}")
            return []

    def _scrape_single(self, url: str) -> str:
        # 1. Trafilatura
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(downloaded, favor_precision=True)
                if text:
                    return f"\n\n{text}\n\n"
        except Exception as e:
            logger.error(f"Trafilatura failed for {url}: {e}")
            pass
        
        # 2. Firecrawl Fallback
        if self.firecrawl:
            try:
                # Attempt generic scrape (handling potential v1/v2 diffs purely by method existence if needed, 
                # but assuming standard 'scrape_url' or 'scrape')
                if hasattr(self.firecrawl, 'scrape_url'):
                    data = self.firecrawl.scrape_url(url, params={"formats": ["markdown"]})
                    if 'markdown' in data:
                        return f"\n\n{data['markdown']}\n\n"
            except Exception as e:
                logger.error(f"Firecrawl failed for {url}: {e}")
        
        return ""

    def scrape_urls(self, urls: List[str]) -> str:
        context = ""
        with ThreadPoolExecutor(max_workers=5) as ex:
            futures = {ex.submit(self._scrape_single, u): u for u in set(urls) if u}
            for f in as_completed(futures):
                res = f.result()
                if res:
                    context += res
        return context

    def run(self, query: str, domains: List[str] = None) -> Tuple[str, List[Dict]]:
        """
        Executes "Omni-Search" Strategy:
        1. Runs DuckDuckGo (Breadth/Free) AND Tavily (Depth/Smart) in PARALLEL.
        2. Merges and deduplicates results.
        3. Fallback to Serper/Google only if both fail.
        4. Scrapes content.
        
        This maximizes recall and minimizes latency compared to sequential waterfalls.
        """
        all_results = []
        
        # Parallel Execution of Primary Providers
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_ddg = executor.submit(self._ddgs_search, query, WEB_SEARCH_MAX_RESULTS, domains)
            
            # Only run Tavily if key exists
            future_tavily = None
            if self.tavily_client:
                future_tavily = executor.submit(self._tavily_search, query, WEB_SEARCH_MAX_RESULTS, domains)
            
            # Collect DDG
            try:
                ddg_res = future_ddg.result()
                if ddg_res:
                    # Mark source
                    for r in ddg_res: r['source'] = 'DuckDuckGo'
                    all_results.extend(ddg_res)
            except Exception as e:
                logger.error(f"DDG Parallel Failed: {e}")

            # Collect Tavily
            if future_tavily:
                try:
                    tav_res = future_tavily.result()
                    if tav_res:
                        # Mark source
                        for r in tav_res: r['source'] = 'Tavily'
                        all_results.extend(tav_res)
                except Exception as e:
                    logger.error(f"Tavily Parallel Failed: {e}")

        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for r in all_results:
            u = r.get('url')
            if u and u not in seen_urls:
                seen_urls.add(u)
                unique_results.append(r)
        
        # Fallback Chain (if parallel search completely failed)
        if not unique_results:
            print("⚠️ Primary parallel search failed. Engaging fallbacks...")
            # Try Serper
            results = self._serper_search(query, WEB_SEARCH_MAX_RESULTS, domains)
            if not results:
                # Try Google SERP
                results = self._google_serp_search(query, WEB_SEARCH_MAX_RESULTS, domains)
            unique_results = results

        # Extract URLs for scraping
        # Limit scraping to avoiding timeout on too many results
        scrape_candidates = [r['url'] for r in unique_results if r.get('url')][:7] 
        
        # Scrape
        full_context = self.scrape_urls(scrape_candidates)
        
        return full_context, unique_results

# Singleton initialization
web_search_tool = WebSearchTool()
if __name__ =="__main__":
    a, b= web_search_tool.run("Andra Pradesh fundamental rights")
    print(a, b, sep="\n\n")
    print(len(a))
