import os
import psycopg2
from dotenv import load_dotenv

from dotenv import load_dotenv, find_dotenv

# Robust load
env_file = find_dotenv()
if env_file:
    load_dotenv(env_file)
else:
    load_dotenv()

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
if not POSTGRES_DSN:
    print("❌ Error: POSTGRES_DSN not found in .env")
    exit(1)

def setup_db():
    print(f"Connecting to DB...")
    try:
        conn = psycopg2.connect(POSTGRES_DSN)
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Enable Vector Extension
        print("Enable 'vector' extension...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

        # 2. Add Columns
        print("Adding 'embedding' and 'search_vector' columns...")
        # embedding: 384 dimensions for all-MiniLM-L6-v2
        cur.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(384);")
        
        # search_vector for Hybrid Search (keyword)
        cur.execute("""
            ALTER TABLE documents 
            ADD COLUMN IF NOT EXISTS search_vector tsvector 
            GENERATED ALWAYS AS (
                to_tsvector('english', coalesce(canonical_title,'') || ' ' || coalesce(snippet,''))
            ) STORED;
        """)

        # 3. Create Indexes
        print("Creating indexes...")
        # IVFFlat or HNSW for vector. HNSW is better for recall/performance usually.
        # We use cosine distance (vector_cosine_ops)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_docs_embedding 
            ON documents USING hnsw (embedding vector_cosine_ops);
        """)

        # GIN index for text search
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_docs_search_vector 
            ON documents USING GIN (search_vector);
        """)

        print("✅ Database schema updated successfully!")
        
        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    setup_db()
