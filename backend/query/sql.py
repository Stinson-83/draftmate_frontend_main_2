import psycopg2
import psycopg2.extras
from psycopg2 import pool
import os
from dotenv import load_dotenv

load_dotenv()
POSTGRES_DSN = os.getenv("POSTGRES_DSN")
if POSTGRES_DSN and "localhost" in POSTGRES_DSN:
    POSTGRES_DSN = POSTGRES_DSN.replace("localhost", "127.0.0.1")

# Global Connection Pool
connection_pool = None
try:
    connection_pool = pool.SimpleConnectionPool(1, 20, POSTGRES_DSN)
    print("[INFO] Connection pool created")
except Exception as e:
    print(f"[ERROR] Error creating connection pool: {e}")

def get_db_connection():
    if connection_pool:
        return connection_pool.getconn()
    else:
        # Fallback
        return psycopg2.connect(POSTGRES_DSN)

def release_db_connection(conn):
    if connection_pool:
        connection_pool.putconn(conn)
    else:
        conn.close()

def search_documents(search_terms, query_embedding=None, raw_query=None, language="en"):
    """
    Hybrid Search:
    1. Vector Search (Semantic) if embedding provided
    2. Full Text Search (Keyword) using search_vector
    3. Trigram/ILIKE Fallback (for fuzzy partial matches) - kept from legacy
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # 1. Vector Search
            vector_results = []
            if query_embedding:
                try:
                    cur.execute("""
                        SELECT doc_id, title, canonical_title, tags, snippet, s3_path,
                               1 - (embedding <=> %s::vector) as score,
                               'vector' as match_type
                        FROM documents
                        WHERE 1 - (embedding <=> %s::vector) > 0.4
                        ORDER BY score DESC
                        LIMIT 20
                    """, (query_embedding, query_embedding))
                    vector_results = cur.fetchall()
                except Exception as e:
                    print(f"⚠️ Vector search failed (schema might not be updated): {e}")
                    conn.rollback() 

            # 2. Text Search (TSVECTOR)
            text_results = []
            if raw_query:
                # websearch_to_tsquery handles complex queries like "loan -repayment"
                try:
                    cur.execute("""
                        SELECT doc_id, title, canonical_title, tags, snippet, s3_path,
                               ts_rank(search_vector, websearch_to_tsquery('english', %s)) as score,
                               'text' as match_type
                        FROM documents
                        WHERE search_vector @@ websearch_to_tsquery('english', %s)
                        ORDER BY score DESC
                        LIMIT 20
                    """, (raw_query, raw_query))
                    text_results = cur.fetchall()
                except Exception as e:
                    # Fallback if search_vector column missing
                    print(f"⚠️ Text search failed: {e}")
                    conn.rollback()

            # 3. Simple ILIKE Fallback (Legacy)
            # Only if we don't have enough results
            legacy_results = []
            if len(vector_results) + len(text_results) < 5:
                # Construct ILIKE query
                sql = """
                SELECT doc_id, title, canonical_title, tags, snippet, s3_path, 
                       0.2 as score, 'legacy' as match_type
                FROM documents WHERE language = %s
                """
                params = [language]
                if search_terms:
                    conds = []
                    for term in search_terms:
                        conds.append("(canonical_title ILIKE %s OR snippet ILIKE %s)")
                        params.extend([f"%{term}%", f"%{term}%"])
                    if conds:
                        sql += " AND (" + " OR ".join(conds) + ")"
                
                sql += " LIMIT 10"
                cur.execute(sql, params)
                legacy_results = cur.fetchall()

            # Combine and Deduplicate
            seen_ids = set()
            final_results = []
            
            # Prioritize Vector -> Text -> Legacy
            # We normalize scores: Vector[0-1], Text[Unbounded->Normalize?], Legacy[0.2]
            
            for r in vector_results:
                if r['doc_id'] not in seen_ids:
                    seen_ids.add(r['doc_id'])
                    final_results.append(dict(r))
            
            for r in text_results:
                if r['doc_id'] not in seen_ids:
                    seen_ids.add(r['doc_id'])
                    # Normalize text score roughly? Or just append.
                    final_results.append(dict(r))
                    
            for r in legacy_results:
                if r['doc_id'] not in seen_ids:
                    seen_ids.add(r['doc_id'])
                    final_results.append(dict(r))
                    
            return final_results

    except Exception as e:
        print(f"[ERROR] DB Error: {e}")
        return []
    finally:
        release_db_connection(conn)
