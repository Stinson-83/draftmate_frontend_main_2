"""
sql_v2.py - Improved version with robust SSH tunnel auto-detection.
CHANGES:
1. Skip auto-tunnel attempt if manual tunnel is already detected (port open)
2. Use ec2-user as SSH username
3. Simplified connection logic
"""
import paramiko
# Monkey-patch paramiko.DSSKey for compatibility with sshtunnel + paramiko 3.0+
if not hasattr(paramiko, "DSSKey"):
    class MockDSSKey:
        @classmethod
        def from_private_key_file(cls, filename, password=None):
            # This is never used for RSA keys, but sshtunnel imports it.
            return None
    paramiko.DSSKey = MockDSSKey

from sshtunnel import SSHTunnelForwarder
import psycopg2
import psycopg2.extras
from psycopg2 import pool
import os
import socket
from dotenv import load_dotenv

load_dotenv()

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
BASTION_IP = os.getenv("BASTION_IP")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT", "privet-lawdb.cfge8ai08o3t.ap-south-1.rds.amazonaws.com")
LOCAL_BIND_PORT = 5432

# Global variables
tunnel = None
connection_pool = None

def is_port_open(host='127.0.0.1', port=LOCAL_BIND_PORT, timeout=1.0):
    """Check if a port is open (manual tunnel running)."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Replace RDS endpoint with localhost for tunneled connections
def _get_tunneled_dsn():
    dsn = POSTGRES_DSN
    if not dsn:
        return None
    
    # ONLY rewrite if we are actually tunneling (i.e. BASTION_IP is set)
    # If no bastion, we assume direct connection (VPC or localhost) and return DSN as-is.
    if not BASTION_IP:
        return dsn

    if "localhost" in dsn:
        dsn = dsn.replace("localhost", "127.0.0.1")
    
    if RDS_ENDPOINT in dsn:
        dsn = dsn.replace(RDS_ENDPOINT, "127.0.0.1")
    elif "amazonaws.com" in dsn:
        import re
        dsn = re.sub(r'@[^:]+', '@127.0.0.1', dsn)
        
    # Ensure port is updated to local bind port
    if ":5432" in dsn:
        dsn = dsn.replace(":5432", f":{LOCAL_BIND_PORT}")
        
    return dsn

def start_tunnel_and_pool():
    global tunnel, connection_pool
    
    # 1. Check if manual tunnel is already running
    if is_port_open():
        logger.info(f"Port {LOCAL_BIND_PORT} is open. Using existing tunnel.")
        try:
            dsn = _get_tunneled_dsn()
            connection_pool = pool.ThreadedConnectionPool(1, 20, dsn)
            logger.info("Threaded connection pool created (Manual Tunnel)")
            return
        except Exception as e:
            logger.error(f"Pool creation failed: {e}")
            return

    # 2. Start auto-tunnel only if port is NOT open
    if BASTION_IP and SSH_KEY_PATH:
        logger.info(f"Starting auto SSH tunnel via {BASTION_IP}...")
        try:
            tunnel = SSHTunnelForwarder(
                (BASTION_IP, 22),
                ssh_username="ec2-user",
                ssh_pkey=SSH_KEY_PATH,
                remote_bind_address=(RDS_ENDPOINT, 5432),
                local_bind_address=('127.0.0.1', LOCAL_BIND_PORT)
            )
            tunnel.start()
            logger.info(f"Auto-tunnel active on port {tunnel.local_bind_port}")
        except Exception as e:
            logger.error(f"Auto-tunnel failed: {e}")
            return

    # 3. Create connection pool
    try:
        dsn = _get_tunneled_dsn()
        connection_pool = pool.ThreadedConnectionPool(1, 20, dsn)
        logger.info("Threaded connection pool created")
    except Exception as e:
        logger.error(f"Error creating connection pool: {e}")

def stop_tunnel_and_pool():
    global tunnel, connection_pool
    if connection_pool:
        logger.info("Closing database connection pool...")
        connection_pool.closeall()
        connection_pool = None
    
    if tunnel:
        logger.info("Stopping SSH tunnel...")
        tunnel.stop()
        tunnel = None

def get_db_connection():
    if connection_pool:
        return connection_pool.getconn()
    else:
        # Fallback if pool wasn't initialized
        logger.warning("Connection pool not initialized. Attempting direct connection.")
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
