"""
sql.py - Production-ready DB connection with pooling.
"""
import psycopg2
import psycopg2.extras
from psycopg2 import pool
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global connection pool
connection_pool = None

def init_pool(dsn):
    """Initialize the threaded connection pool."""
    global connection_pool
    try:
        connection_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=20,
            dsn=dsn
        )
        logger.info("✅ Database connection pool initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize connection pool: {e}")
        raise e

def close_pool():
    """Close all connections in the pool."""
    global connection_pool
    if connection_pool:
        connection_pool.closeall()
        connection_pool = None
        logger.info("Database connection pool closed")

def get_db_connection():
    """Get a connection from the pool."""
    if connection_pool:
        return connection_pool.getconn()
    else:
        raise RuntimeError("Connection pool not initialized. Call init_pool() first.")

def release_db_connection(conn):
    """Return a connection to the pool."""
    if connection_pool:
        connection_pool.putconn(conn)
    else:
        # Fallback if pool was closed (shouldn't happen in normal flow)
        try:
            conn.close()
        except Exception:
            pass


def search_documents(search_terms, query_embedding=None, raw_query=None, language="en"):
    """
    Hybrid Search v2:
    1. Vector Search (Semantic) - Score 0.0-1.0
    2. Full Text Search (Keyword) - Score Normalized
    3. Trigram Fuzzy Search (Title Matching) - Score 0.0-1.0
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
                               (1 - (embedding <=> %s::vector)) as raw_score,
                               'vector' as match_type
                        FROM documents
                        WHERE (1 - (embedding <=> %s::vector)) > 0.35
                        ORDER BY raw_score DESC
                        LIMIT 25
                    """, (query_embedding, query_embedding))
                    vector_results = cur.fetchall()
                except Exception as e:
                    print(f"[WARN] Vector search failed: {e}")
                    conn.rollback()

            # 2. Text Search (TSVECTOR)
            text_results = []
            if raw_query:
                try:
                    cur.execute("""
                        SELECT doc_id, title, canonical_title, tags, snippet, s3_path,
                               LEAST(ts_rank(search_vector, websearch_to_tsquery('english', %s)) * 1.5, 1.0) as raw_score,
                               'text' as match_type
                        FROM documents
                        WHERE search_vector @@ websearch_to_tsquery('english', %s)
                        ORDER BY raw_score DESC
                        LIMIT 20
                    """, (raw_query, raw_query))
                    text_results = cur.fetchall()
                except Exception as e:
                    print(f"[WARN] Text search failed: {e}")
                    conn.rollback()

            # 3. Trigram Fuzzy Search
            trigram_results = []
            if raw_query and len(raw_query) > 3:
                try:
                    cur.execute("""
                        SELECT doc_id, title, canonical_title, tags, snippet, s3_path,
                               similarity(canonical_title, %s::text) as raw_score,
                               'fuzzy' as match_type
                        FROM documents
                        WHERE similarity(canonical_title, %s::text) > 0.3
                        ORDER BY raw_score DESC
                        LIMIT 15
                    """, (raw_query, raw_query))
                    trigram_results = cur.fetchall()
                except Exception as e:
                    print(f"[WARN] Trigram search failed: {e}")
                    conn.rollback()

            # 4. Legacy ILIKE fallback
            legacy_results = []
            total_hits = len(vector_results) + len(text_results) + len(trigram_results)
            
            if total_hits < 3 and search_terms:
                sql = """
                SELECT doc_id, title, canonical_title, tags, snippet, s3_path, 
                       0.2 as raw_score, 'legacy' as match_type
                FROM documents WHERE language = %s
                """
                params = [language]
                conds = []
                for term in search_terms:
                    conds.append("(canonical_title ILIKE %s OR snippet ILIKE %s)")
                    params.extend([f"%{term}%", f"%{term}%"])
                if conds:
                    sql += " AND (" + " OR ".join(conds) + ")"
                    sql += " LIMIT 10"
                    try:
                        cur.execute(sql, params)
                        legacy_results = cur.fetchall()
                    except Exception:
                        conn.rollback()

            # Combine results with score fusion
            doc_map = {}
            
            def add_result(row, source_weight=1.0):
                did = row['doc_id']
                score = float(row['raw_score']) * source_weight
                
                if did not in doc_map:
                    doc_map[did] = {
                        "doc_id": did,
                        "title": row.get("title"),
                        "canonical_title": row.get("canonical_title"),
                        "tags": row.get("tags"),
                        "snippet": row.get("snippet"),
                        "s3_path": row.get("s3_path"),
                        "score": score,
                        "sources": {row['match_type']}
                    }
                else:
                    curr = doc_map[did]['score']
                    doc_map[did]['score'] = max(curr, score) + (0.2 * min(curr, score))
                    doc_map[did]['sources'].add(row['match_type'])

            for r in vector_results: add_result(r, 1.0)
            for r in trigram_results: add_result(r, 1.2)
            for r in text_results: add_result(r, 0.9)
            for r in legacy_results: add_result(r, 0.5)
            
            final_results = list(doc_map.values())
            final_results.sort(key=lambda x: x['score'], reverse=True)
            
            return final_results[:40]

    except Exception as e:
        print(f"[ERROR] DB Error: {e}")
        return []
    finally:
        release_db_connection(conn)
