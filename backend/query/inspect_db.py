import sys
import os
import logging

# Disable paramiko logging noise
logging.getLogger("paramiko").setLevel(logging.WARNING)

# Import the modified module
try:
    import sql
except ImportError:
    sys.path.append(os.getcwd())
    import sql

def inspect_data():
    print("--- START INSPECTION ---", flush=True)
    try:
        sql.start_tunnel_and_pool()
        conn = sql.get_db_connection()
        if conn:
            with conn.cursor() as cur:
                # Check count
                print("Checking row count...", flush=True)
                cur.execute("SELECT count(*) FROM documents")
                count = cur.fetchone()[0]
                print(f"Total documents: {count}", flush=True)

                if count > 0:
                    print("Fetching 3 sample rows...", flush=True)
                    cur.execute("SELECT doc_id, title, (embedding IS NULL) as emb_null FROM documents LIMIT 3;")
                    rows = cur.fetchall()
                    for i, r in enumerate(rows):
                        print(f"Row {i+1}: ID={r[0]} | Title='{r[1]}' | Embedding Is Null={r[2]}", flush=True)
                else:
                    print("Table is EMPTY!", flush=True)

            sql.release_db_connection(conn)
        else:
            print("[FAILED] Connection is None", flush=True)
            
    except Exception as e:
        print(f"[FAILED] Error: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        sql.stop_tunnel_and_pool()
        print("--- END INSPECTION ---", flush=True)

if __name__ == "__main__":
    inspect_data()
