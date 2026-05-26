import sys
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

# Import the modified module
try:
    import sql
except ImportError:
    # Handle the case where we are running from a different directory
    sys.path.append(os.getcwd())
    import sql

def verify():
    print("--- STARTING VERIFICATION ---")
    print(f"Checking configured local bind port in sql.py... {getattr(sql, 'LOCAL_BIND_PORT', 'Unknown')}")
    
    try:
        print("Initializing tunnel and pool...")
        sql.start_tunnel_and_pool()
        
        conn = sql.get_db_connection()
        if conn:
            print("[SUCCESS] DB Connection established!")
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                res = cur.fetchone()
                print(f"[SUCCESS] Query executed. Result: {res}")
            
            sql.release_db_connection(conn)
        else:
            print("[FAILED] Connection is None")
            
    except Exception as e:
        print(f"[FAILED] Error during verification: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Cleaning up...")
        sql.stop_tunnel_and_pool()
        print("--- VERIFICATION COMPLETE ---")

if __name__ == "__main__":
    verify()
