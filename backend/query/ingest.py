#!/usr/bin/env python3
"""
ingest_local_only.py

- Creates documents table if missing
- Reads JSON/JSONL input containing metadata records
- Prompts interactively for missing required fields (unless INTERACTIVE=false)
- Uses ONLY local files found in UPLOAD_FOLDER (prefers html). Does NOT download from download_url.
- Uploads the chosen local file to S3 (if found)
- Inserts/updates a row in Postgres documents table with s3_path and metadata
- Writes updated JSON to scraped_data_with_s3.json (UTF-8)
"""
import os
import json
import uuid
import re
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from tqdm import tqdm
import boto3
import psycopg2
from psycopg2.extras import execute_values
from sentence_transformers import SentenceTransformer

# Load Model (Global) - efficiently loaded only once
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
print(f"Loading embedding model: {EMBEDDING_MODEL_NAME}...")
model = SentenceTransformer(EMBEDDING_MODEL_NAME)


load_dotenv()

# ---------- Config (from .env) ----------
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET = os.getenv("S3_BUCKET")
POSTGRES_DSN = os.getenv("POSTGRES_DSN")
UPLOAD_FOLDER = Path(os.getenv("UPLOAD_FOLDER", "./downloaded_files"))
INPUT_JSON = os.getenv("INPUT_JSON", "scraped_data.jsonl")
INTERACTIVE = os.getenv("INTERACTIVE", "true").lower() in ("1","true","yes")

# required env check
for e in ("AWS_ACCESS_KEY_ID","AWS_SECRET_ACCESS_KEY","S3_BUCKET","POSTGRES_DSN"):
    if not os.getenv(e):
        raise SystemExit(f"Please set {e} in .env")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

conn = psycopg2.connect(POSTGRES_DSN)

SIZE_RE = re.compile(r"([\d\.]+)\s*(KB|MB|B)?", re.I)
COMMON_EXTS = [".html", ".htm", ".pdf", ".rtf", ".docx", ".txt"]

def parse_size_kb(size_str):
    if not size_str: return None
    m = SIZE_RE.search(str(size_str))
    if not m: return None
    val = float(m.group(1)); unit = (m.group(2) or "KB").upper()
    if unit == "B": return val/1024.0
    if unit == "KB": return val
    if unit == "MB": return val*1024.0
    return val

def create_table_if_not_exists():
    ddl = """
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS documents (
      doc_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT,
      canonical_title TEXT,
      doc_type TEXT,
      source_url TEXT,
      download_url TEXT,
      original_filename TEXT,
      file_extension TEXT,
      file_size_kb FLOAT,
      language TEXT,
      scrape_timestamp timestamptz,
      s3_path TEXT,
      snippet TEXT,
      tags TEXT[],
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    """
    with conn.cursor() as cur:
        cur.execute(ddl)
        conn.commit()

def read_input(path):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(path)
    text = p.read_text(encoding="utf-8")
    try:
        data = json.loads(text)
        if isinstance(data, list): return data
        if isinstance(data, dict): return [data]
    except json.JSONDecodeError:
        out = []
        for line in text.splitlines():
            if line.strip():
                out.append(json.loads(line))
        return out

def normalize_name_for_match(name: str) -> str:
    """Lowercase, remove spaces/dashes/underscores and strip known extensions."""
    s = (name or "").lower().strip()
    s = re.sub(r'\.(html|htm|pdf|rtf|docx|txt)$', '', s)
    s = re.sub(r'[\s\-_]+', '', s)
    return s

def find_local_file_by_name(orig_base: str) -> Path:
    """
    Look for a local file in UPLOAD_FOLDER that matches orig_base (normalized).
    Preference order: .html/.htm first, then any matching common ext.
    Returns Path or None.
    """
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    target_norm = normalize_name_for_match(orig_base)

    # 1) prefer explicit html/htm file
    for ext in (".html", ".htm"):
        candidate = UPLOAD_FOLDER / f"{orig_base}{ext}"
        if candidate.exists():
            return candidate

    # 2) scan folder for normalized matches
    for fname in os.listdir(UPLOAD_FOLDER):
        fpath = UPLOAD_FOLDER / fname
        if not fpath.is_file():
            continue
        # normalized compare
        if normalize_name_for_match(fname) == target_norm:
            return fpath

    # 3) try common ext variants appended to orig_base
    for ext in COMMON_EXTS:
        candidate = UPLOAD_FOLDER / f"{orig_base}{ext}"
        if candidate.exists():
            return candidate

    return None

def ensure_local_file(rec):
    """
    Return a Path if a local file exists to use for this record.
    DO NOT download anything. Use only local files.
    """
    # explicit local_path
    lp = rec.get("local_path")
    if lp and Path(lp).exists():
        return Path(lp)

    orig = rec.get("original_filename") or rec.get("title") or ""
    # strip ext if accidentally present
    orig_base = re.sub(r'\.(html|htm|pdf|rtf|docx|txt)$', '', orig, flags=re.I)
    # try best-match
    found = find_local_file_by_name(orig_base)
    return found  # may be None if not found

def s3_upload(local_path: Path, doc_id: str):
    key = f"docs/{doc_id}/{local_path.name}"
    ext = local_path.suffix.lower()
    content_type = "application/octet-stream"
    if ext==".pdf": content_type="application/pdf"
    elif ext in (".html",".htm"): content_type="text/html"
    elif ext==".rtf": content_type="application/rtf"
    elif ext==".docx": content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    s3.upload_file(str(local_path), S3_BUCKET, key, ExtraArgs={"ContentType": content_type})
    s3_uri = f"s3://{S3_BUCKET}/{key}"
    https_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
    return s3_uri, https_url

def upsert_documents(records):
    with conn.cursor() as cur:
        sql = """
        INSERT INTO documents (
            doc_id, title, canonical_title, doc_type, source_url, download_url,
            original_filename, file_extension, file_size_kb, language,
            scrape_timestamp, s3_path, snippet, tags, embedding, created_at, updated_at
        ) VALUES %s
        ON CONFLICT (doc_id) DO UPDATE SET
            title = EXCLUDED.title,
            canonical_title = EXCLUDED.canonical_title,
            doc_type = EXCLUDED.doc_type,
            source_url = EXCLUDED.source_url,
            download_url = EXCLUDED.download_url,
            original_filename = EXCLUDED.original_filename,
            file_extension = EXCLUDED.file_extension,
            file_size_kb = EXCLUDED.file_size_kb,
            language = EXCLUDED.language,
            scrape_timestamp = EXCLUDED.scrape_timestamp,
            s3_path = EXCLUDED.s3_path,
            snippet = EXCLUDED.snippet,
            tags = EXCLUDED.tags,
            snippet = EXCLUDED.snippet,
            tags = EXCLUDED.tags,
            embedding = EXCLUDED.embedding,
            updated_at = now();
        """
        values = []
        for r in records:
            tags = r.get("tags")
            if isinstance(tags, list):
                tags_arr = tags
            elif isinstance(tags, str):
                tags_arr = [t.strip() for t in tags.split(",") if t.strip()]
            else:
                tags_arr = None

            # Generate Embedding
            text_to_embed = f"{r.get('title') or ''} {r.get('snippet') or ''}".strip()
            embedding = model.encode(text_to_embed).tolist() if text_to_embed else None

            values.append((
                r.get("doc_id"),
                r.get("title"),
                r.get("canonical_title"),
                r.get("doc_type"),
                r.get("source_url"),
                r.get("download_url"),
                r.get("original_filename"),
                r.get("file_extension"),
                r.get("file_size_kb"),
                r.get("language"),
                r.get("scrape_timestamp"),
                r.get("s3_path"),
                r.get("snippet"),
                tags_arr,
                embedding,
                r.get("created_at") or datetime.utcnow(),
                r.get("updated_at") or datetime.utcnow()
            ))
        execute_values(cur, sql, values)
        conn.commit()

def prompt_missing(rec):
    """Prompt user for missing important fields when INTERACTIVE true"""
    required = {
        "title": "Title",
        "original_filename": "Original filename (e.g. acknowledgment)",
        "file_extension": "File extension (e.g. .rtf, .pdf, .html)"
    }
    for k, label in required.items():
        if not rec.get(k):
            if INTERACTIVE:
                val = input(f"[INPUT] {label} for record (suggested: '{rec.get('title') or rec.get('download_url')}'): ").strip()
                if val:
                    rec[k]= val
            else:
                if k=="original_filename" and rec.get("title"):
                    rec[k] = rec["title"].lower().replace(" ", "_")
                elif k=="file_extension":
                    rec[k] = rec.get("file_extension") or ".bin"
                elif k=="title":
                    rec[k] = rec.get("original_filename") or "untitled"
    if rec.get("file_extension") and not rec["file_extension"].startswith("."):
        rec["file_extension"] = "." + rec["file_extension"]
    if rec.get("file_size_kb") and isinstance(rec.get("file_size_kb"), str):
        rec["file_size_kb"] = parse_size_kb(rec["file_size_kb"])
    rec["canonical_title"] = rec.get("title","").strip().lower()
    if not rec.get("doc_id"):
        rec["doc_id"] = str(uuid.uuid4())
    return rec

def main():
    print("==> Ensure your .env is configured and RDS is reachable.")
    create_table_if_not_exists()
    data = read_input(INPUT_JSON)
    print(f"Loaded {len(data)} record(s) from {INPUT_JSON}")
    updated = []
    for rec in tqdm(data):
        rec = prompt_missing(rec)
        local_file = ensure_local_file(rec)
        if not local_file:
            # No local file found — DO NOT download. Keep metadata row, s3_path = None
            print(f"[NO-LOCAL] No local file for '{rec.get('title')}' (doc_id={rec.get('doc_id')}). Skipping upload.")
            rec["s3_path"] = None
            updated.append(rec)
            continue

        # local file found — upload to S3
        try:
            s3_uri, public_url = s3_upload(local_file, rec["doc_id"])
            rec["s3_path"] = s3_uri
            rec["s3_public_url"] = public_url
            rec["created_at"] = rec.get("scrape_timestamp") or datetime.utcnow().isoformat()
            print(f"[UPLOADED] {local_file.name} -> {s3_uri}")
            updated.append(rec)
        except Exception as e:
            print(f"[UPLOAD-ERR] Failed to upload {local_file}: {e}")
            rec["s3_path"] = None
            updated.append(rec)

    # upsert into postgres
    upsert_documents(updated)

    # write updated json with utf-8
    out_path = Path("scraped_data_with_s3.json")
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    print(f" Done. Wrote {len(updated)} records to DB and {out_path}")

if __name__=="__main__":
    main()
