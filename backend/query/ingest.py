#!/usr/bin/env python3
"""
ingest_local_only.py

- Uses IAM role (NO AWS keys)
- Uploads local files to S3 (cross-region supported)
- Inserts / upserts metadata into Postgres (RDS)
- Generates embeddings using SentenceTransformers
- Safe for AWS App Runner
"""

import os
import json
import uuid
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

from dotenv import load_dotenv
from tqdm import tqdm

import boto3
import psycopg2
from psycopg2.extras import execute_values
from sentence_transformers import SentenceTransformer

# ============================================================
# Load ENV
# ============================================================

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_REGION = os.getenv("S3_BUCKET_REGION", "ap-south-1")
S3_BUCKET = os.getenv("S3_BUCKET")
POSTGRES_DSN = os.getenv("POSTGRES_DSN")

UPLOAD_FOLDER = Path(os.getenv("UPLOAD_FOLDER", "./downloaded_files"))
INPUT_JSON = os.getenv("INPUT_JSON", "scraped_data.jsonl")
INTERACTIVE = os.getenv("INTERACTIVE", "true").lower() in ("1", "true", "yes")

# Required env validation
for var in ("S3_BUCKET", "POSTGRES_DSN"):
    if not os.getenv(var):
        raise SystemExit(f"Missing required env variable: {var}")

# ============================================================
# Clients (IAM Role Based)
# ============================================================

s3 = boto3.client(
    "s3",
    region_name=S3_BUCKET_REGION
)

conn = psycopg2.connect(POSTGRES_DSN)

# ============================================================
# Embedding Model (Loaded Once)
# ============================================================

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CACHE_FOLDER = os.getenv("SENTENCE_TRANSFORMERS_HOME", "/app/models")
print(f"Loading embedding model: {EMBEDDING_MODEL_NAME} from {CACHE_FOLDER}")
model = SentenceTransformer(EMBEDDING_MODEL_NAME, cache_folder=CACHE_FOLDER)

# ============================================================
# Utils
# ============================================================

SIZE_RE = re.compile(r"([\d\.]+)\s*(KB|MB|B)?", re.I)
COMMON_EXTS = [".html", ".htm", ".pdf", ".rtf", ".docx", ".txt"]

def parse_size_kb(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    match = SIZE_RE.search(str(value))
    if not match:
        return None

    size = float(match.group(1))
    unit = (match.group(2) or "KB").upper()

    if unit == "B":
        return size / 1024
    if unit == "KB":
        return size
    if unit == "MB":
        return size * 1024
    return size

def normalize_name(name: str) -> str:
    name = name.lower()
    name = re.sub(r'\.(html|htm|pdf|rtf|docx|txt)$', '', name)
    name = re.sub(r'[\s\-_]+', '', name)
    return name

# ============================================================
# DB Setup
# ============================================================

def create_table_if_not_exists():
    ddl = """
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS documents (
        doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT,
        canonical_title TEXT,
        doc_type TEXT,
        source_url TEXT,
        download_url TEXT,
        original_filename TEXT,
        file_extension TEXT,
        file_size_kb FLOAT,
        language TEXT,
        scrape_timestamp TIMESTAMPTZ,
        s3_path TEXT,
        snippet TEXT,
        tags TEXT[],
        embedding VECTOR(384),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    """
    with conn.cursor() as cur:
        cur.execute(ddl)
        conn.commit()

# ============================================================
# File Handling
# ============================================================

def find_local_file(base_name: str) -> Optional[Path]:
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    target = normalize_name(base_name)

    for file in UPLOAD_FOLDER.iterdir():
        if file.is_file() and normalize_name(file.name) == target:
            return file

    for ext in COMMON_EXTS:
        candidate = UPLOAD_FOLDER / f"{base_name}{ext}"
        if candidate.exists():
            return candidate

    return None

def ensure_local_file(record: Dict) -> Optional[Path]:
    if record.get("local_path"):
        path = Path(record["local_path"])
        if path.exists():
            return path

    base = record.get("original_filename") or record.get("title") or ""
    base = re.sub(r'\.(html|htm|pdf|rtf|docx|txt)$', '', base, flags=re.I)
    return find_local_file(base)

# ============================================================
# S3 Upload
# ============================================================

def upload_to_s3(file_path: Path, doc_id: str):
    key = f"docs/{doc_id}/{file_path.name}"

    content_type = "application/octet-stream"
    if file_path.suffix in (".html", ".htm"):
        content_type = "text/html"
    elif file_path.suffix == ".pdf":
        content_type = "application/pdf"

    s3.upload_file(
        Filename=str(file_path),
        Bucket=S3_BUCKET,
        Key=key,
        ExtraArgs={"ContentType": content_type}
    )

    return {
        "s3_uri": f"s3://{S3_BUCKET}/{key}",
        "https_url": f"https://{S3_BUCKET}.s3.{S3_BUCKET_REGION}.amazonaws.com/{key}"
    }

# ============================================================
# Ingest Logic
# ============================================================

def read_input(path: str) -> List[Dict]:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(path)

    text = p.read_text(encoding="utf-8")
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else [data]
    except json.JSONDecodeError:
        return [json.loads(line) for line in text.splitlines() if line.strip()]

def upsert_documents(records: List[Dict]):
    sql = """
    INSERT INTO documents (
        doc_id, title, canonical_title, doc_type, source_url, download_url,
        original_filename, file_extension, file_size_kb, language,
        scrape_timestamp, s3_path, snippet, tags, embedding,
        created_at, updated_at
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
        embedding = EXCLUDED.embedding,
        updated_at = now();
    """

    values = []
    for r in records:
        text = f"{r.get('title','')} {r.get('snippet','')}".strip()
        embedding = model.encode(text).tolist() if text else None

        values.append((
            r["doc_id"],
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
            r.get("tags"),
            embedding,
            r.get("created_at"),
            r.get("updated_at")
        ))

    with conn.cursor() as cur:
        execute_values(cur, sql, values)
        conn.commit()

# ============================================================
# Main
# ============================================================

def main():
    print("Starting ingestion job...")
    create_table_if_not_exists()

    records = read_input(INPUT_JSON)
    processed = []

    for rec in tqdm(records):
        rec.setdefault("doc_id", str(uuid.uuid4()))
        rec["canonical_title"] = (rec.get("title") or "").lower().strip()
        rec["file_size_kb"] = parse_size_kb(rec.get("file_size_kb"))

        local_file = ensure_local_file(rec)

        if local_file:
            try:
                s3_info = upload_to_s3(local_file, rec["doc_id"])
                rec["s3_path"] = s3_info["s3_uri"]
                rec["s3_public_url"] = s3_info["https_url"]
            except Exception as e:
                print(f"S3 upload failed for {local_file}: {e}")
                rec["s3_path"] = None
        else:
            print(f"No local file for {rec.get('title')}")

        rec["created_at"] = rec.get("created_at") or datetime.utcnow()
        rec["updated_at"] = datetime.utcnow()
        processed.append(rec)

    upsert_documents(processed)

    with open("scraped_data_with_s3.json", "w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)

    print("Ingestion complete.")

if __name__ == "__main__":
    main()
