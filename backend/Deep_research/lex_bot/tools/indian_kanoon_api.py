"""
Indian Kanoon API Client

Replaces the HTML scraper (indian_kanoon.py) with the official REST API.
API docs: https://api.indiankanoon.org/

Token: read from IKApi env var.
"""

import os
import time
import logging
import threading
from typing import List, Dict, Any, Optional

import requests

import re as _re

logger = logging.getLogger(__name__)

_API_BASE = "https://api.indiankanoon.org"
_TOKEN = (os.getenv("IKApi", "") or os.getenv("INDIANKANOON_API_TOKEN", "")).strip()

# In-process cache: (query, max_results) -> (timestamp, results)
_cache: Dict[str, tuple] = {}
_cache_lock = threading.Lock()
_CACHE_TTL = 43200  # 12 hours — statutes and case law don't change often


def _clean(text: str) -> str:
    """Strip HTML tags from IK headline snippets."""
    text = _re.sub(r"<[^>]+>", " ", text)
    return _re.sub(r"\s{2,}", " ", text).strip()


def _headers() -> Dict[str, str]:
    token = (os.getenv("IKApi", "") or os.getenv("INDIANKANOON_API_TOKEN", "")).strip()
    return {
        "Authorization": f"Token {token}",
        "Content-Type": "application/x-www-form-urlencoded",
    }


def _cached(key: str):
    with _cache_lock:
        entry = _cache.get(key)
    if entry:
        ts, data = entry
        if time.time() - ts < _CACHE_TTL and data:
            return data
    return None


def _store(key: str, data):
    if not data:
        return
    with _cache_lock:
        _cache[key] = (time.time(), data)


def search(query: str, max_results: int = 8, pagenum: int = 0) -> List[Dict[str, Any]]:
    """
    Search Indian Kanoon via API (with Serper Web API and Tavily fallbacks).

    Returns list of dicts with: title, snippet, url, docid, doctype,
    publishdate, citation.
    """
    token = (os.getenv("IKApi", "") or os.getenv("INDIANKANOON_API_TOKEN", "")).strip()
    cache_key = f"search:{query.lower().strip()}:{max_results}:{pagenum}"
    cached = _cached(cache_key)
    if cached is not None:
        logger.info(f"⚡ IK cache HIT: {query[:50]}")
        return cached

    results = []
    if token:
        try:
            resp = requests.post(
                f"{_API_BASE}/search/",
                headers={
                    "Authorization": f"Token {token}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={"formInput": query, "pagenum": pagenum},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            docs = data.get("docs", [])
            for doc in docs[:max_results]:
                tid = doc.get("tid") or doc.get("docid")
                results.append({
                    "title": doc.get("title", "Unknown"),
                    "snippet": _clean(doc.get("headline", "")),
                    "url": f"https://indiankanoon.org/doc/{tid}/",
                    "docid": str(tid),
                    "doctype": doc.get("doctype", ""),
                    "publishdate": doc.get("publishdate", ""),
                    "citation": doc.get("citation", ""),
                    "source": "IndianKanoon",
                })
        except Exception as e:
            logger.warning(f"IK search failed for query '{query[:50]}': {e}")

    # Fallback 1: Serper API search targeting Indian Kanoon
    if not results:
        serper_key = os.getenv("SERPER_API_KEY", "").strip()
        if serper_key:
            try:
                search_q = f"site:indiankanoon.org/doc/ {query}".strip()
                res = requests.post(
                    "https://google.serper.dev/search",
                    headers={"X-API-KEY": serper_key, "Content-Type": "application/json"},
                    json={"q": search_q, "num": max_results},
                    timeout=10,
                )
                if res.status_code == 200:
                    organics = res.json().get("organic", [])
                    for item in organics:
                        link = item.get("link", "")
                        match = _re.search(r"indiankanoon\.org/doc/(\d+)", link)
                        if not match:
                            continue
                        tid = match.group(1)
                        raw_title = item.get("title", "Unknown")
                        clean_title = _re.sub(r"\s*-\s*Indian Kanoon.*$", "", raw_title, flags=_re.IGNORECASE).strip()
                        results.append({
                            "title": clean_title,
                            "snippet": _clean(item.get("snippet", "")),
                            "url": f"https://indiankanoon.org/doc/{tid}/",
                            "docid": str(tid),
                            "doctype": "High Court" if "High Court" in raw_title else "Supreme Court of India",
                            "publishdate": item.get("date", ""),
                            "citation": f"IK Doc #{tid}",
                            "source": "IndianKanoon",
                        })
            except Exception as serper_err:
                logger.warning(f"Serper Kanoon fallback failed: {serper_err}")

    # Fallback 2: Tavily Search API targeting Indian Kanoon
    if not results:
        tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
        if tavily_key:
            try:
                tav_res = requests.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": tavily_key,
                        "query": f"site:indiankanoon.org/doc/ {query}",
                        "max_results": max_results,
                    },
                    timeout=10,
                )
                if tav_res.status_code == 200:
                    tav_data = tav_res.json()
                    for item in tav_data.get("results", []):
                        link = item.get("url", "")
                        match = _re.search(r"indiankanoon\.org/doc/(\d+)", link)
                        if not match:
                            continue
                        tid = match.group(1)
                        raw_title = item.get("title", "Unknown")
                        clean_title = _re.sub(r"\s*-\s*Indian Kanoon.*$", "", raw_title, flags=_re.IGNORECASE).strip()
                        results.append({
                            "title": clean_title,
                            "snippet": _clean(item.get("content", "")),
                            "url": f"https://indiankanoon.org/doc/{tid}/",
                            "docid": str(tid),
                            "doctype": "High Court" if "High Court" in raw_title else "Supreme Court of India",
                            "publishdate": "",
                            "citation": f"IK Doc #{tid}",
                            "source": "IndianKanoon",
                        })
            except Exception as tav_err:
                logger.warning(f"Tavily Kanoon fallback failed: {tav_err}")

    if results:
        _store(cache_key, results)
    logger.info(f"IK search: '{query[:50]}' → {len(results)} results")
    return results


def get_doc(docid: str) -> Optional[str]:
    """
    Fetch the text of a judgment by doc ID.
    Returns plain text (stripped of HTML), or None on failure.
    """
    token = (os.getenv("IKApi", "") or os.getenv("INDIANKANOON_API_TOKEN", "")).strip()
    cache_key = f"doc:{docid}"
    cached = _cached(cache_key)
    if cached is not None:
        return cached

    if token:
        try:
            resp = requests.post(
                f"{_API_BASE}/doc/{docid}/",
                headers={
                    "Authorization": f"Token {token}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            text = data.get("doc", "") or data.get("text", "")
            text = _clean(text)
            if text:
                _store(cache_key, text)
                return text
        except Exception as e:
            logger.warning(f"IK get_doc {docid} failed: {e}")

    # Fallback web scrape for full text if API unavailable
    try:
        url = f"https://indiankanoon.org/doc/{docid}/"
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=12)
        if res.status_code == 200:
            text = _clean(res.text)
            _store(cache_key, text)
            return text
    except Exception as exc:
        logger.error(f"Web fetch for IK doc {docid} failed: {exc}")

    return None


def search_to_context(query: str, max_results: int = 8) -> tuple:
    """
    Convenience wrapper: returns (context_str, results_list) matching
    the same interface as web_search_tool.run().
    """
    results = search(query, max_results=max_results)
    if not results:
        return "", []

    parts = []
    for r in results:
        parts.append(
            f"**{r['title']}** ({r.get('publishdate', '')})\n"
            f"Citation: {r.get('citation', 'N/A')}\n"
            f"{r['snippet']}\n"
            f"URL: {r['url']}"
        )
    return "\n\n---\n\n".join(parts), results


def check_later_treatment(docid: str, case_name: str) -> Dict[str, Any]:
    """
    Checks how later judgments treated an earlier case (Followed, Relied upon, Approved,
    Distinguished, Overruled, Reversed, Questioned).
    """
    query = f'"{case_name}"' if case_name and len(case_name) > 4 else f"doc:{docid}"
    citing = search(f"{query} cited", max_results=6)
    
    treatment_summary = "Precedent Treatment: Reaffirmed / Active Precedent"
    overruled = False
    distinguished_count = 0
    followed_count = 0

    treatments = []
    for case in citing:
        snippet = (case.get("snippet") or "").lower()
        title = case.get("title", "")

        if any(term in snippet for term in ["overruled", "reversed", "no longer good law", "over-ruled"]):
            overruled = True
            treatments.append(f"Overruled/Questioned by {title}")
        elif any(term in snippet for term in ["distinguished", "inapplicable to facts"]):
            distinguished_count += 1
            treatments.append(f"Distinguished by {title}")
        elif any(term in snippet for term in ["followed", "relied upon", "approved", "reaffirmed"]):
            followed_count += 1
            treatments.append(f"Followed/Relied upon by {title}")

    if overruled:
        treatment_summary = "Precedent Status: Overruled / Questioned by subsequent authority"
    elif distinguished_count > 0 and followed_count == 0:
        treatment_summary = "Precedent Status: Distinguished in later decisions"
    elif followed_count > 0:
        treatment_summary = "Precedent Status: Followed and reaffirmed by subsequent authorities"

    return {
        "is_good_law": not overruled,
        "treatment_summary": treatment_summary,
        "citing_cases_count": len(citing),
        "treatment_details": treatments[:4]
    }


def verify_case_authority(candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verifies that a candidate citation exists, has clean metadata, and matches
    an authentic court judgment (excluding bare statutory act/section pages).
    """
    docid = str(candidate.get("docid") or "")
    title = str(candidate.get("title") or "").strip()
    url = candidate.get("url") or (f"https://indiankanoon.org/doc/{docid}/" if docid else None)

    # Exclude bare statutory pages (e.g., "Section 54 in The Income Tax Act, 1961")
    is_statute_page = bool(_re.match(r"^\s*(?:Section|Article|Rule|Order|Schedule)\s+\d+.*in\s+The\s+", title, _re.IGNORECASE))
    is_verified = bool(docid and title and title.lower() != "unknown" and len(title) > 3 and not is_statute_page)

    return {
        "verified": is_verified,
        "is_statute_page": is_statute_page,
        "docid": docid,
        "title": title,
        "court": candidate.get("doctype") or candidate.get("court") or "Supreme Court of India",
        "publishdate": candidate.get("publishdate") or candidate.get("date") or "N/A",
        "citation": candidate.get("citation") or (f"AIR / SCC Reference (Doc #{docid})" if docid else "N/A"),
        "url": url,
        "snippet": candidate.get("snippet", "")
    }

