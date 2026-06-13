from sshtunnel import SSHTunnelForwarder
import psycopg2
import psycopg2.extras
from psycopg2 import pool
import os
from dotenv import load_dotenv

load_dotenv()

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
BASTION_IP = os.getenv("BASTION_IP")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT", "privet-lawdb.cfge8ai08o3t.ap-south-1.rds.amazonaws.com")

# Global variables for tunnel and pool
tunnel = None
connection_pool = None

def start_tunnel_and_pool():
    global tunnel, connection_pool
    
    dsn = POSTGRES_DSN
    if dsn and "localhost" in dsn:
        dsn = dsn.replace("localhost", "127.0.0.1")

    # 1. Check for existing connection (Manual Tunnel or Local DB)
    import socket
    from urllib.parse import urlparse, urlunparse

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex(('127.0.0.1', 5432))
        sock.close()
        
        if result == 0:
            print("[INFO] Port 5432 is open. Switching to Manual Tunnel (Localhost).")
        else:
            print(f"[DEBUG] Port 5432 check returned: {result} (Not Open)")
            
            # Force DSN to localhost
            if dsn:
                # Basic parsing to replace host
                # We can't rely on urlparse for postgresql:// sometimes, so simple string replace is safer
                # providing we replace the hostname part.
                # Let's try to replace the RDS_ENDPOINT first.
                if RDS_ENDPOINT in dsn:
                    dsn = dsn.replace(RDS_ENDPOINT, "127.0.0.1")
                elif "amazonaws.com" in dsn:
                     # General fallback if RDS_ENDPOINT env var doesn't match string exactly
                     # Find the host part between @ and :5432
                     import re
                     dsn = re.sub(r'@.*:5432', '@127.0.0.1:5432', dsn)
                
                # Downgrade SSL for localhost tunneling to avoid hostname mismatch errors
                if "sslmode=verify-full" in dsn:
                    dsn = dsn.replace("sslmode=verify-full", "sslmode=prefer")
                
                # Ensure connection timeout
                if "connect_timeout" not in dsn:
                    dsn += "&connect_timeout=10" if "?" in dsn else "?connect_timeout=10"

            try:
                print(f"[DEBUG] Attempting connection to: {dsn.split('@')[-1]}")
                connection_pool = pool.SimpleConnectionPool(1, 20, dsn)
                print("[INFO] Connection pool created successfully using Manual Tunnel.")
                return
            except Exception as e:
                print(f"[ERROR] Port 5432 open but pool creation failed: {e}")
    except Exception as e:
        print(f"[INFO] Check for existing tunnel failed: {e}")

    # 2. Start Tunnel if Bastion info is provided (and port wasn't open)
    # ... logic continues ...
    if BASTION_IP and SSH_KEY_PATH:
        # If we got here, port 5432 was NOT open. Proceed with auto-tunnel.
        print(f"[INFO] Starting SSH Tunnel via {BASTION_IP}...")
        try:
            # Paramiko compatibility hack
            import paramiko
            if not hasattr(paramiko, 'DSSKey'):
                 class MockDSSKey: pass
                 paramiko.DSSKey = MockDSSKey

            tunnel = SSHTunnelForwarder(
                (BASTION_IP, 22),
                ssh_username="ec2-user",  # Updated to ec2-user
                ssh_pkey=SSH_KEY_PATH,
                remote_bind_address=(RDS_ENDPOINT, 5432),
                local_bind_address=('127.0.0.1', 5432)
            )
            tunnel.start()
            print(f"[INFO] Tunnel active on local port {tunnel.local_bind_port}")
        except Exception as e:
            print(f"[ERROR] Tunnel failed: {e}")
            # If tunnel fails, we still try connecting directly (might be on local network)

    # 3. Create Connection Pool (if not created in step 1)
    try:
        connection_pool = pool.SimpleConnectionPool(1, 20, dsn)
        print("[INFO] Connection pool created")
    except Exception as e:
        print(f"[ERROR] Error creating connection pool: {e}")

# Call init once at module level
start_tunnel_and_pool()

def get_db_connection():
    if connection_pool:
        return connection_pool.getconn()
    else:
        return psycopg2.connect(POSTGRES_DSN)

def release_db_connection(conn):
    if connection_pool:
        connection_pool.putconn(conn)
    else:
        conn.close()

def search_documents(search_terms, query_embedding=None, raw_query=None, language="en"):
    """
    Hybrid Search v2:
    1. Vector Search (Semantic) - Score 0.0-1.0
    2. Full Text Search (Keyword) - Score Normalized
    3. Trigram Fuzzy Search (Title Matching) - Score 0.0-1.0
    
    Returns unified list of results with 'normalized_score'
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Ensure pg_trgm extension exists for fuzzy matching
            try:
                cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
            except Exception:
                conn.rollback() 

            # 1. Vector Search
            vector_results = []
            if query_embedding:
                try:
                    # 1 - (embedding <=> vector) is Cosine Similarity (-1 to 1). 
                    # We clamp negatives to 0 so range is roughly 0 to 1.
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
                    print(f"⚠️ Vector search failed: {e}")
                    conn.rollback() 

            # 2. Text Search (TSVECTOR)
            text_results = []
            if raw_query:
                try:
                    # ts_rank usually returns 0.1 to 0.9. We cap it at 1.0.
                    # We also boost titles using weights (setweight).
                    # Assuming search_vector is configured. If not, fallback to simple rank.
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
                    print(f"⚠️ Text search failed: {e}")
                    conn.rollback()

            # 3. Trigram/Fuzzy title search (Good for "Renal agreement" -> "Rental agreement")
            trigram_results = []
            if raw_query and len(raw_query) > 3:
                try:
                    # similarity() returns 0-1.
                    cur.execute("""
                        SELECT doc_id, title, canonical_title, tags, snippet, s3_path,
                               similarity(canonical_title, %s) as raw_score,
                               'fuzzy' as match_type
                        FROM documents
                        WHERE similarity(canonical_title, %s) > 0.3
                        ORDER BY raw_score DESC
                        LIMIT 15
                    """, (raw_query, raw_query))
                    trigram_results = cur.fetchall()
                except Exception as e:
                    print(f"⚠️ Trigram search failed: {e}")
                    conn.rollback()

            # 4. Fallback: Simple ILIKE (Legacy)
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

            # Combine and Deduplicate with Score Fusion
            # We want to boost documents that appear in multiple methods
            
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
                    # Boost score if found again, but with diminishing returns
                    # Max possible score logic: max(existing, new) + 0.1 boost?
                    # Or just addition? Addition might blow up > 1.0.
                    # Let's use: max(existing, new) + (0.2 * min(existing, new))
                    curr = doc_map[did]['score']
                    doc_map[did]['score'] = max(curr, score) + (0.2 * min(curr, score))
                    doc_map[did]['sources'].add(row['match_type'])

            # Weights: Vector is most reliable (1.0), Trigram is great for exact/typo titles (1.2), Text is okay (0.9)
            for r in vector_results: add_result(r, 1.0)
            for r in trigram_results: add_result(r, 1.2) # High trust on title match
            for r in text_results: add_result(r, 0.9)
            for r in legacy_results: add_result(r, 0.5)
            
            # Convert to list
            final_results = list(doc_map.values())
            
            # Final sort
            final_results.sort(key=lambda x: x['score'], reverse=True)
            
            return final_results[:40]

    except Exception as e:
        print(f"[ERROR] DB Error: {e}")
        return []
    finally:
        release_db_connection(conn)
