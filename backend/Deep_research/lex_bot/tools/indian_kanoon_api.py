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
_TOKEN = os.getenv("IKApi", "").strip()

# In-process cache: (query, max_results) -> (timestamp, results)
_cache: Dict[str, tuple] = {}
_cache_lock = threading.Lock()
_CACHE_TTL = 43200  # 12 hours — statutes and case law don't change often


def _clean(text: str) -> str:
    """Strip HTML tags from IK headline snippets."""
    text = _re.sub(r"<[^>]+>", " ", text)
    return _re.sub(r"\s{2,}", " ", text).strip()


def _headers() -> Dict[str, str]:
    return {
        "Authorization": f"Token {_TOKEN}",
        "Content-Type": "application/x-www-form-urlencoded",
    }


def _cached(key: str):
    with _cache_lock:
        entry = _cache.get(key)
    if entry:
        ts, data = entry
        if time.time() - ts < _CACHE_TTL:
            return data
    return None


def _store(key: str, data):
    with _cache_lock:
        _cache[key] = (time.time(), data)


def search(query: str, max_results: int = 8, pagenum: int = 0) -> List[Dict[str, Any]]:
    """
    Search Indian Kanoon via API.

    Returns list of dicts with: title, snippet, url, docid, doctype,
    publishdate, citation.
    """
    if not _TOKEN:
        logger.warning("IKApi token not set — Indian Kanoon API unavailable")
        return []

    cache_key = f"search:{query.lower().strip()}:{max_results}:{pagenum}"
    cached = _cached(cache_key)
    if cached is not None:
        logger.info(f"⚡ IK cache HIT: {query[:50]}")
        return cached

    try:
        resp = requests.post(
            f"{_API_BASE}/search/",
            headers=_headers(),
            data={"formInput": query, "pagenum": pagenum},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error(f"IK search failed: {e}")
        return []

    docs = data.get("docs", [])
    results = []
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

    _store(cache_key, results)
    logger.info(f"IK search: '{query[:50]}' → {len(results)} results")
    return results


def get_doc(docid: str) -> Optional[str]:
    """
    Fetch the text of a judgment by doc ID.
    Returns plain text (stripped of HTML), or None on failure.
    """
    if not _TOKEN:
        return None

    cache_key = f"doc:{docid}"
    cached = _cached(cache_key)
    if cached is not None:
        return cached

    try:
        resp = requests.post(
            f"{_API_BASE}/doc/{docid}/",
            headers=_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data.get("doc", "") or data.get("text", "")
        text = _clean(text)
    except Exception as e:
        logger.error(f"IK get_doc {docid} failed: {e}")
        return None

    _store(cache_key, text)
    return text


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
