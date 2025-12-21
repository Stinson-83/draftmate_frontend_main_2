import numpy as np
import math
from typing import List, Dict, Optional
from ..config import RERANK_MODEL

# Safe Import
_reranker = None
HAS_SENTENCE_TRANSFORMERS = False

try:
    from sentence_transformers import CrossEncoder
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    print("[WARN] Sentence Transformers not found/broken. Reranking disabled.")

def get_reranker():
    global _reranker
    if not HAS_SENTENCE_TRANSFORMERS:
        return None
        
    if _reranker is None:
        try:
            print(f"[RERANK] Loading Reranker: {RERANK_MODEL}...")
            # FORCE CPU to avoid OOM on weak GPUs / limited VRAM envs
            _reranker = CrossEncoder(RERANK_MODEL, trust_remote_code=True, device='cpu')
        except Exception as e:
            print(f"[ERROR] Failed to load Reranker model: {e}")
            return None
            
    return _reranker

def _build_text_for_rerank(c: Dict) -> str:
    title = c.get("title") or ""
    heading = c.get("heading") or ""
    body = c.get("search_hit") or c.get("text") or ""
    return f"{title} > {heading}: {body}".strip()

def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))

def rerank_documents(query: str, candidates: List[Dict], top_n: int = 10, threshold: Optional[float] = None) -> List[Dict]:
    """
    Robust Reranking.
    """
    if not candidates:
        return []

    rr = get_reranker()
    
    if rr is None:
        # Fallback: Just return top N based on whatever order they came in (usually search engine rank)
        # Assign dummy scores
        for c in candidates:
            if 'rerank_score' not in c:
                c['rerank_score'] = 0.5 # Neutral
        return candidates[:top_n]
    
    try:
        # Prepare pairs for cross-encoder
        pairs = [(query, _build_text_for_rerank(c)) for c in candidates]
        
        # Predict
        raw_scores = rr.predict(pairs)
        
        # Handle single/list output
        if not isinstance(raw_scores, (list, np.ndarray)):
            raw_scores = [raw_scores]
            
        scores_list = raw_scores.tolist() if hasattr(raw_scores, "tolist") else raw_scores

        # Normalize and Assign
        for c, s in zip(candidates, scores_list):
            c['rerank_score'] = _sigmoid(float(s))
            c['raw_rerank_score'] = float(s)

        # Sort
        candidates.sort(key=lambda x: x['rerank_score'], reverse=True)
        
        # Filter
        if threshold is not None:
            candidates = [c for c in candidates if c['rerank_score'] >= threshold]
            
    except Exception as e:
        print(f"[WARN] Rerank failed during prediction: {e}")
        return candidates[:top_n]
        
    return candidates[:top_n]
