import os
import psycopg2
from dotenv import load_dotenv, find_dotenv

# Robust load
env_file = find_dotenv()
if env_file:
    load_dotenv(env_file)
else:
    load_dotenv()

dsn = os.getenv("POSTGRES_DSN")
print(f"Testing connection to: {dsn.split('@')[1] if dsn and '@' in dsn else 'Unknown'}")

try:
    conn = psycopg2.connect(dsn)
    print("[OK] Connection Successful!")
    
    # Check if vector extension exists
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM pg_extension WHERE extname = 'vector'")
        if cur.fetchone():
            print("[OK] 'vector' extension is enabled.")
        else:
            print("[WARN] 'vector' extension is MISSING. Run setup_db.py!")
            
        # Check columns
        try:
            cur.execute("SELECT embedding FROM documents LIMIT 1")
            print("[OK] 'embedding' column exists.")
        except Exception:
             print("[WARN] 'embedding' column MISSING. Run setup_db.py!")      
    
    conn.close()
except Exception as e:
    print(f"[ERROR] Connection Failed: {e}")
