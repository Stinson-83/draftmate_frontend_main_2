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
    """
    Takes s3://bucket/key and downloads to ./downloaded_results/<filename>
    Returns local file path.
    """
    parsed = urlparse(s3_uri)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")
    filename = key.split("/")[-1]

    os.makedirs(download_dir, exist_ok=True)
    local_path = os.path.join(download_dir, filename)

    print(f"Downloading {s3_uri} → {local_path} ...")
    s3_client.download_file(bucket, key, local_path)
    print("✅ Download Complete.")

    return local_path


def safe_normalize_query(user_query):
    """Call LLM parser but never fail — always return dict with search_terms."""
    try:
        parsed = normalize_query(user_query)   # your Gemini wrapper
        print("DEBUG: parsed from Gemini ->", parsed)
        if not parsed or not parsed.get("search_terms"):
            # fallback: simple token extraction
            kw = [w.strip().lower() for w in re.findall(r"[A-Za-z0-9]+", user_query) if len(w) > 2]
            parsed = {"search_terms": kw[:8], "language": parsed.get("language") if parsed and parsed.get("language") else "en"}
            print("DEBUG: Gemini empty; fallback tokens ->", parsed["search_terms"])
        return parsed
    except Exception as e:
        print("DEBUG: Parser error:", e)
        kw = [w.strip().lower() for w in re.findall(r"[A-Za-z0-9]+", user_query) if len(w) > 2]
        print("DEBUG: falling back tokens ->", kw[:8])
        return {"search_terms": kw[:8], "language": "en"}

# drop-in replacement: improved search that matches phrases + tokens, and lowercases tags
import re
from difflib import SequenceMatcher
import psycopg2.extras

def tokens_from_phrase(phrase):
    # split on non-word characters and remove tiny tokens
    toks = [t.lower() for t in re.findall(r"[A-Za-z0-9]+", phrase) if len(t) > 2]
    return toks

def search_documents_permissive(search_terms, language="en"):
    """
    More permissive search: for each search_term (which might be a phrase),
    we look for:
      - canonical_title ILIKE %phrase% OR snippet ILIKE %phrase%
      - OR any token in phrase matches canonical_title ILIKE %token% OR snippet ILIKE %token%
      - OR token equals any tag (case-insensitive)
    """
    sql_base = """
    SELECT doc_id, title, canonical_title, tags, snippet, s3_path
    FROM documents
    WHERE 1=1
    """
    params = []

    # language filter (allow rows where language is NULL)
    if language:
        sql_base += " AND (language = %s OR language IS NULL)"
        params.append(language)

    # Build OR block for all phrase/token matches
    or_parts = []
    for phrase in search_terms:
        phrase = phrase.strip()
        if not phrase:
            continue
        phrase_param = f"%{phrase}%"
        # phrase match
        or_parts.append("(canonical_title ILIKE %s OR snippet ILIKE %s)")
        params.extend([phrase_param, phrase_param])

        # token matches
        toks = tokens_from_phrase(phrase)
        for tk in toks:
            tok_param = f"%{tk}%"
            or_parts.append("(canonical_title ILIKE %s OR snippet ILIKE %s)")
            params.extend([tok_param, tok_param])
            # tag equality (case-insensitive) -> use lower(%s) = ANY(SELECT lower(t) FROM unnest(tags) t)
            # Simpler: compare lower(tag) = tk by using ANY with lower-casing of tags:
            or_parts.append("(%s = ANY(ARRAY(SELECT lower(x) FROM unnest(tags) x)))")
            params.append(tk)

    if or_parts:
        sql_base += " AND (" + " OR ".join(or_parts) + ")"

    sql_base += " LIMIT 40"

    # debug
    print("DEBUG: Executing permissive SQL:")
    print(sql_base)
    print("DEBUG: PARAMS:", params)

    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(sql_base, params)
        rows = cur.fetchall()
        print(f"DEBUG: DB returned {len(rows)} rows")
        if rows:
            print("DEBUG: sample title/snippet:", rows[0]["title"], "|", (rows[0]["snippet"] or "")[:120])
        return rows

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

def get_best_template(user_query):
    print("=== get_best_template called with:", user_query)
    
    # 1. GENERATE EMBEDDING (Required for both paths)
    query_embedding = None
    try:
        # Lower latency by encoding immediately
        query_embedding = model.encode(user_query).tolist()
    except Exception as e:
        print(f"Embedding failed: {e}")

    # 2. FAST PATH SEARCH (Direct search on raw user query)
    print("DEBUG: Running Fast-Path Search...")
    candidates = search_documents([], query_embedding=query_embedding, raw_query=user_query)
    
    def process_candidates(cand_list, query):
        if not cand_list: return []
        # Score candidates. Use DB score as weight.
        scored = []
        for r in cand_list:
            # combine db score (0-1) with text similarity
            db_score = float(r.get("score", 0))
            text_sim = score_match(r, query)
            # Favor db_score (especially vector) but fuzzy match helps tie-break
            final_s = (db_score * 0.7) + (text_sim * 0.3)
            scored.append((final_s, r))
        scored.sort(reverse=True, key=lambda x: x[0])
        return scored

    scored = process_candidates(candidates, user_query)
    
    # Check if Fast-Path is "Good Enough" (Score > 0.6)
    if scored and scored[0][0] > 0.6:
        print(f"DEBUG: Fast-Path SUCCESS (Score: {scored[0][0]:.3f})")
    else:
        # 3. SLOW PATH (Gemini Normalization)
        print("DEBUG: Fast-Path weak or empty. Calling Gemini...")
        parsed = safe_normalize_query(user_query)
        terms = parsed.get("search_terms", []) or []
        
        # Second pass with expanded terms
        more_candidates = search_documents(terms, query_embedding=query_embedding, raw_query=user_query)
        
        # Merge results
        seen = {c['doc_id'] for c in candidates}
        for mc in more_candidates:
            if mc['doc_id'] not in seen:
                candidates.append(mc)
        
        scored = process_candidates(candidates, user_query)

    if not scored:
        print("DEBUG: No candidates found -> returning None")
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



# Test code (uncomment to run locally)
# if __name__ == "__main__":
#     result, scored = get_best_template("I need acknowledgement letter for loan repayment")
#     if result:
#         local_file = download_from_s3(result["s3_path"])
#         print("\n File ready:", local_file)
#     else:
#         print("\n No match found")
