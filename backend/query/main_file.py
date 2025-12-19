"""
main_file_v2.py - Improved version with lower Fast-Path threshold.
CHANGES:
1. Lower threshold from 0.6 to 0.45 (less Gemini calls = faster)
2. Uses sql_v2 for cleaner tunnel handling
"""
from QueryParsing import normalize_query
from scoring import score_match 
from sql import search_documents
from sentence_transformers import SentenceTransformer

import os
import re
from difflib import SequenceMatcher
from urllib.parse import urlparse
from dotenv import load_dotenv
import boto3

load_dotenv()

# Load Model
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
print(f"Loading embedding model: {EMBEDDING_MODEL_NAME}...")
model = SentenceTransformer(EMBEDDING_MODEL_NAME)

# Create S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "ap-south-1")
)


def download_from_s3(s3_uri, download_dir="downloaded_results"):
    parsed = urlparse(s3_uri)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")
    filename = key.split("/")[-1]

    os.makedirs(download_dir, exist_ok=True)
    local_path = os.path.join(download_dir, filename)

    print(f"Downloading {s3_uri} -> {local_path} ...")
    s3_client.download_file(bucket, key, local_path)
    print("Download Complete.")

    return local_path


def safe_normalize_query(user_query):
    """Call LLM parser but never fail."""
    try:
        parsed = normalize_query(user_query)
        if not parsed or not parsed.get("search_terms"):
            kw = [w.strip().lower() for w in re.findall(r"[A-Za-z0-9]+", user_query) if len(w) > 2]
            parsed = {"search_terms": kw[:8], "language": "en"}
        return parsed
    except Exception as e:
        print("DEBUG: Parser error:", e)
        kw = [w.strip().lower() for w in re.findall(r"[A-Za-z0-9]+", user_query) if len(w) > 2]
        return {"search_terms": kw[:8], "language": "en"}


def score_match(row, user_query):
    title = (row.get("canonical_title") or row.get("title") or "").lower()
    snippet = (row.get("snippet") or "").lower()
    q = user_query.lower()
    score_title = SequenceMatcher(None, title, q).ratio()
    score_snip = SequenceMatcher(None, snippet, q).ratio()
    tags = row.get("tags") or []
    tag_boost = 0.15 if any(t.lower() in q for t in tags) else 0.0
    score = min(1.0, (score_title * 0.6 + score_snip * 0.3) + tag_boost)
    return score


# === LOWER THRESHOLD FOR FASTER RESPONSE ===
FAST_PATH_THRESHOLD = 0.45  # Was 0.6


def get_best_template(user_query):
    print("=== get_best_template called with:", user_query)
    
    # Generate embedding
    query_embedding = None
    try:
        query_embedding = model.encode(user_query).tolist()
    except Exception as e:
        print(f"Embedding failed: {e}")

    # Fast-Path Search
    print("DEBUG: Running Fast-Path Search...")
    candidates = search_documents([], query_embedding=query_embedding, raw_query=user_query)
    
    def process_candidates(cand_list, query):
        if not cand_list: return []
        scored = []
        for r in cand_list:
            db_score = float(r.get("score", 0))
            text_sim = score_match(r, query)
            final_s = (db_score * 0.7) + (text_sim * 0.3)
            scored.append((final_s, r))
        scored.sort(reverse=True, key=lambda x: x[0])
        return scored

    scored = process_candidates(candidates, user_query)
    
    # Check if Fast-Path is good enough (LOWER THRESHOLD)
    if scored and scored[0][0] > FAST_PATH_THRESHOLD:
        print(f"DEBUG: Fast-Path SUCCESS (Score: {scored[0][0]:.3f})")
    else:
        # Slow-Path (Gemini)
        print("DEBUG: Fast-Path weak. Calling Gemini...")
        parsed = safe_normalize_query(user_query)
        terms = parsed.get("search_terms", []) or []
        
        more_candidates = search_documents(terms, query_embedding=query_embedding, raw_query=user_query)
        
        seen = {c['doc_id'] for c in candidates}
        for mc in more_candidates:
            if mc['doc_id'] not in seen:
                candidates.append(mc)
        
        scored = process_candidates(candidates, user_query)

    if not scored:
        print("DEBUG: No candidates found")
        return None, []

    best_score, best_doc = scored[0]
    print("DEBUG: Best score:", best_score, "Best title:", best_doc["title"])
    
    result = {
        "title": best_doc["title"],
        "doc_id": str(best_doc["doc_id"]),
        "score": round(best_score, 3),
        "s3_path": best_doc["s3_path"],
        "alternatives": [{"title": r["title"], "score": round(s,3), "s3_path": r["s3_path"]} for s, r in scored[1:6]]
    }
    return result, scored
