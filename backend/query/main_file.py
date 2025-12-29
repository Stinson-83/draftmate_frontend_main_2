"""
main_file_v2.py

- IAM-role based S3 access (NO AWS keys)
- Fast-path + slow-path query matching
- Cross-region S3 safe
- App Runner production ready
"""

from QueryParsing import normalize_query
from sql import search_documents
from sentence_transformers import SentenceTransformer

import os
import re
from difflib import SequenceMatcher
from urllib.parse import urlparse
from dotenv import load_dotenv
import boto3

# ============================================================
# ENV
# ============================================================

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_REGION = os.getenv("S3_BUCKET_REGION", AWS_REGION)

# ============================================================
# MODEL (loaded once)
# ============================================================

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CACHE_FOLDER = os.getenv("SENTENCE_TRANSFORMERS_HOME", "/app/models")
print(f"Loading embedding model: {EMBEDDING_MODEL_NAME} from {CACHE_FOLDER}")
model = SentenceTransformer(EMBEDDING_MODEL_NAME, cache_folder=CACHE_FOLDER)

# ============================================================
# S3 CLIENT (IAM ROLE BASED)
# ============================================================

s3_client = boto3.client(
    "s3",
    region_name=S3_BUCKET_REGION
)

# ============================================================
# S3 DOWNLOAD
# ============================================================

def download_from_s3(s3_uri: str, download_dir: str = "downloaded_results") -> str:
    parsed = urlparse(s3_uri)

    if parsed.scheme != "s3":
        raise ValueError(f"Invalid S3 URI: {s3_uri}")

    bucket = parsed.netloc
    key = parsed.path.lstrip("/")
    filename = os.path.basename(key)

    os.makedirs(download_dir, exist_ok=True)
    local_path = os.path.join(download_dir, filename)

    print(f"[S3] Downloading {s3_uri} -> {local_path}")
    s3_client.download_file(bucket, key, local_path)

    return local_path

# ============================================================
# QUERY NORMALIZATION (SAFE)
# ============================================================

def safe_normalize_query(user_query: str) -> dict:
    """
    Always returns a usable parsed query.
    Never raises.
    """
    try:
        parsed = normalize_query(user_query)
        if parsed and parsed.get("search_terms"):
            return parsed
    except Exception as e:
        print("[normalize_query] failed:", e)

    keywords = [
        w.lower()
        for w in re.findall(r"[A-Za-z0-9]+", user_query)
        if len(w) > 2
    ]

    return {
        "search_terms": keywords[:8],
        "language": "en"
    }

# ============================================================
# SCORING
# ============================================================

def text_similarity_score(row: dict, user_query: str) -> float:
    title = (row.get("canonical_title") or row.get("title") or "").lower()
    snippet = (row.get("snippet") or "").lower()
    query = user_query.lower()

    score_title = SequenceMatcher(None, title, query).ratio()
    score_snippet = SequenceMatcher(None, snippet, query).ratio()

    tags = row.get("tags") or []
    tag_boost = 0.15 if any(t.lower() in query for t in tags) else 0.0

    return min(1.0, (score_title * 0.6 + score_snippet * 0.3) + tag_boost)

# ============================================================
# SEARCH LOGIC
# ============================================================

FAST_PATH_THRESHOLD = 0.45  # tuned for speed

def get_best_template(user_query: str):
    print("[search] get_best_template:", user_query)

    # Generate embedding
    try:
        query_embedding = model.encode(user_query).tolist()
    except Exception as e:
        print("[embedding] failed:", e)
        query_embedding = None

    # ---------------- FAST PATH ----------------
    candidates = search_documents(
        terms=[],
        query_embedding=query_embedding,
        raw_query=user_query
    )

    def score_candidates(rows):
        scored = []
        for r in rows or []:
            db_score = float(r.get("score", 0.0))
            text_score = text_similarity_score(r, user_query)
            final_score = (db_score * 0.7) + (text_score * 0.3)
            scored.append((final_score, r))
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored

    scored = score_candidates(candidates)

    # ---------------- SLOW PATH ----------------
    if not scored or scored[0][0] <= FAST_PATH_THRESHOLD:
        print("[search] Fast path weak → slow path")

        parsed = safe_normalize_query(user_query)
        terms = parsed.get("search_terms", [])

        more = search_documents(
            terms=terms,
            query_embedding=query_embedding,
            raw_query=user_query
        )

        seen = {r["doc_id"] for r in candidates}
        for r in more:
            if r["doc_id"] not in seen:
                candidates.append(r)

        scored = score_candidates(candidates)

    if not scored:
        return None, []

    best_score, best_doc = scored[0]

    result = {
        "title": best_doc["title"],
        "doc_id": str(best_doc["doc_id"]),
        "score": round(best_score, 3),
        "s3_path": best_doc["s3_path"],
        "alternatives": [
            {
                "title": r["title"],
                "score": round(s, 3),
                "s3_path": r["s3_path"]
            }
            for s, r in scored[1:6]
        ]
    }

    return result, scored
