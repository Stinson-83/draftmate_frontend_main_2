import os
import psycopg2
from psycopg2.extras import execute_batch
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv, find_dotenv

# Robust load
env_file = find_dotenv()
if env_file:
    load_dotenv(env_file)
else:
    load_dotenv()

# Force IPv4 if localhost is failing
dsn = os.getenv("POSTGRES_DSN")
if not dsn:
    print( "Error: POSTGRES_DSN not found in .env")
    exit(1)

if "localhost" in dsn:
    print(" 'localhost' found in DSN. Forcing '127.0.0.1' to avoid IPv6 issues.")
    dsn = dsn.replace("localhost", "127.0.0.1")

print(f"Connecting to DB...")
try:
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Setup Schema
    print("1. Ensuring Schema (Vector Extension & Columns)...")
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(384);")
        cur.execute("""
            ALTER TABLE documents 
            ADD COLUMN IF NOT EXISTS search_vector tsvector 
            GENERATED ALWAYS AS (
                to_tsvector('english', coalesce(canonical_title,'') || ' ' || coalesce(snippet,''))
            ) STORED;
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_embedding ON documents USING hnsw (embedding vector_cosine_ops);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_search_vector ON documents USING GIN (search_vector);")
        print("Schema OK.")
    except Exception as e:
        print(f"Schema update warning (might already exist): {e}")

    # 2. Backfill Embeddings
    print("2. Backfilling Embeddings...")
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    
    cur.execute("SELECT doc_id, title, snippet FROM documents WHERE embedding IS NULL")
    rows = cur.fetchall()
    print(f"Found {len(rows)} documents needing embeddings.")

    batch_size = 50
    updates = []
    
    for doc_id, title, snippet in rows:
        text = f"{title or ''} {snippet or ''}".strip()
        if text:
            emb = model.encode(text).tolist()
            updates.append((emb, doc_id))
        
        if len(updates) >= batch_size:
            execute_batch(cur, "UPDATE documents SET embedding = %s::vector WHERE doc_id = %s", updates)
            print(f"Updated {len(updates)} docs...")
            updates = []
            
    if updates:
        execute_batch(cur, "UPDATE documents SET embedding = %s::vector WHERE doc_id = %s", updates)
        print(f"Updated remaining {len(updates)} docs.")

    print("Backfill Complete.")
    cur.close()
    conn.close()

except Exception as e:
    print(f"Critical DB Error: {e}")
