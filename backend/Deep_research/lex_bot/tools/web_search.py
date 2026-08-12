import logging
import requests
import asyncio
import httpx
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Tuple, Optional
import trafilatura
from tavily import TavilyClient
from ddgs import DDGS
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
                
        import threading
        self._search_lock = threading.Lock()
        self._search_cache = {}
        self._scrape_lock = threading.Lock()
        self._scrape_cache = {}

    def _ddgs_search(self, query: str, max_results: int, domains: List[str] = None) -> List[Dict]:
        try:
            target_domains = domains if domains else PREFERRED_DOMAINS
            # Create site: operators
            domain_filter = " OR ".join(f"site:{d}" for d in target_domains)
            full_query = f"{query} ({domain_filter})"
            
            res = []
            with DDGS(timeout=10) as ddgs:
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
                include_domains=target_domains,
                include_raw_content=True
            )
            res = []
            for r in response.get('results', []):
                # If raw_content is available, use it as the snippet/content to bypass scraping
                content = r.get('raw_content') or r.get('content', '')
                res.append({
                    "title": r.get('title', 'Unknown'),
                    "url": r.get('url', ''),
                    "snippet": content
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

    async def _async_scrape_single(self, url: str, client: httpx.AsyncClient) -> str:
        """Scrape a single URL concurrently with caching."""
        import time
        from lex_bot.config import WEB_CACHE_TTL_SECONDS
        
        # --- SCRAPE CACHE ---
        cache_key = url.strip().lower()
        with self._scrape_lock:
            if cache_key in self._scrape_cache:
                timestamp, cached_content = self._scrape_cache[cache_key]
                if time.time() - timestamp < WEB_CACHE_TTL_SECONDS:
                    logger.info(f"⚡ Scrape Cache HIT: {url[:50]}...")
                    return cached_content
                else:
                    del self._scrape_cache[cache_key]
        # --------------------
        
        content = ""
        html_content = ""
        
        # 1. Download HTML using async HTTPX client
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            resp = await client.get(url, headers=headers, timeout=10.0, follow_redirects=True)
            if resp.status_code == 200:
                html_content = resp.text
        except Exception as e:
            logger.error(f"Async download failed for {url}: {e}")
            
        # 2. Extract using CPU-bound parser in a thread to prevent blocking
        if html_content:
            try:
                extracted_text = await asyncio.to_thread(
                    trafilatura.extract, html_content, favor_precision=True
                )
                if extracted_text:
                    content = f"\n\n{extracted_text}\n\n"
            except Exception as e:
                logger.error(f"Parsing failed for {url}: {e}")
        
        # 3. Firecrawl Fallback
        if not content and self.firecrawl:
            try:
                def run_firecrawl():
                    if hasattr(self.firecrawl, 'scrape_url'):
                        return self.firecrawl.scrape_url(url, params={"formats": ["markdown"]})
                    return {}
                data = await asyncio.to_thread(run_firecrawl)
                if data and 'markdown' in data:
                    content = f"\n\n{data['markdown']}\n\n"
            except Exception as e:
                logger.error(f"Firecrawl failed for {url}: {e}")
        
        # --- SAVE TO CACHE ---
        if content:
            with self._scrape_lock:
                self._scrape_cache[cache_key] = (time.time(), content)
        
        return content

    async def _async_scrape_urls(self, urls: List[str]) -> str:
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        async with httpx.AsyncClient(limits=limits, follow_redirects=True, timeout=10.0) as client:
            tasks = [self._async_scrape_single(u, client) for u in set(urls) if u]
            results = await asyncio.gather(*tasks)
            return "".join(results)

    def scrape_urls(self, urls: List[str]) -> str:
        if not urls:
            return ""
        try:
            return asyncio.run(self._async_scrape_urls(urls))
        except RuntimeError:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                from concurrent.futures import ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=1) as executor:
                    return executor.submit(asyncio.run, self._async_scrape_urls(urls)).result()
            else:
                return loop.run_until_complete(self._async_scrape_urls(urls))

    def run(self, query: str, domains: List[str] = None) -> Tuple[str, List[Dict]]:
        """
        Executes "Omni-Search" Strategy with Caching:
        1. Check Cache first.
        2. If miss, run Omni-Search (DDG + Tavily -> Fallbacks).
        3. Save to Cache.
        """
        import time
        from lex_bot.config import WEB_CACHE_TTL_SECONDS

        # --- CACHE LOOKUP ---
        cache_key = f"{query.strip().lower()}:{','.join(sorted(domains)) if domains else 'all'}"
        
        with self._search_lock:
            if cache_key in self._search_cache:
                timestamp, cached_context, cached_results = self._search_cache[cache_key]
                if time.time() - timestamp < WEB_CACHE_TTL_SECONDS:
                    logger.info(f"⚡ Cache HIT for query: '{query}'")
                    return cached_context, cached_results
                else:
                    del self._search_cache[cache_key]
        # --------------------

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

        # === Smart Scraping (Step 9a): Tavily-first, scrape-only-if-insufficient ===
        # Classify results by content richness
        # Tavily advanced often returns 500+ chars of content — use it directly
        RICH_CONTENT_THRESHOLD = 500  # chars
        rich_results = []
        thin_results = []
        
        for r in unique_results:
            content = r.get('snippet', '') or r.get('content', '') or ''
            if len(content) >= RICH_CONTENT_THRESHOLD:
                # Promote snippet to full text — content is rich enough
                r['text'] = content
                rich_results.append(r)
            else:
                thin_results.append(r)
        
        if rich_results:
            logger.info(f"📊 Smart scrape: {len(rich_results)} rich results (skip scraping), {len(thin_results)} thin (will scrape)")
        
        # Build context from rich results first (no scraping needed)
        rich_context = "\n\n".join([r.get('text', r.get('snippet', '')) for r in rich_results])
        
        # Scrape ONLY thin results that need more content (preserves fallback scraping)
        scraped_context = ""
        if thin_results:
            scrape_urls = [r['url'] for r in thin_results if r.get('url')][:5]  # Max 5 thin URLs
            if scrape_urls:
                scraped_context = self.scrape_urls(scrape_urls)
        
        full_context = rich_context + scraped_context
        
        # --- SAVE TO CACHE ---
        with self._search_lock:
            self._search_cache[cache_key] = (time.time(), full_context, unique_results)
        
        return full_context, unique_results

# Singleton initialization
web_search_tool = WebSearchTool()
if __name__ =="__main__":
    a, b= web_search_tool.run("Andra Pradesh fundamental rights")
    print(a, b, sep="\n\n")
    print(len(a))
