import sys
import os
import logging

# Setup basic logging
logging.basicConfig(level=logging.DEBUG)

# Ensure we can import sql
sys.path.append(os.getcwd())
try:
    import sql
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def verify_internal():
    print("--- INTERNAL DOCKER VERIFICATION ---", flush=True)
    try:
        sql.start_tunnel_and_pool()
        conn = sql.get_db_connection()
        
        if conn:
            print("[SUCCESS] Got DB Connection!", flush=True)
            with conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM documents")
                count = cur.fetchone()[0]
                print(f"[SUCCESS] ROW COUNT: {count}", flush=True)
            sql.release_db_connection(conn)
        else:
            print("[FAILURE] Connection was None.", flush=True)
            
    except Exception as e:
        print(f"[CRITICAL FAILURE] Exception: {e}", flush=True)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_internal()
