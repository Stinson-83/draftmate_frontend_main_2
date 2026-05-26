import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(override=True)
dsn = os.getenv("POSTGRES_DSN")

# 1. Try Original
print(f"\n--- ATTEMPT 1: DSN from .env ---")
print(f"DSN: {dsn}")
try:
    conn = psycopg2.connect(dsn)
    print("SUCCESS: Connected to original DSN!")
    conn.close()
except Exception as e:
    print(f"FAILURE: {e}")

# 2. Try forcing DB name 'privet-lawdb'
print(f"\n--- ATTEMPT 2: Forcing DB='privet-lawdb' ---")
try:
    # Construct new DSN
    # Assuming standard format ...@host:port/dbname
    if "/postgres" in dsn:
        new_dsn = dsn.replace("/postgres", "/privet-lawdb")
    else:
        # Fallback if DSN doesn't end in /postgres (append or replace default)
        # Just use explicit args if parsing is hard, but string replace is easiest for test
        new_dsn = dsn.replace("/postgres", "/privet-lawdb")
        if new_dsn == dsn: # didn't change
            new_dsn = dsn.rsplit("/", 1)[0] + "/privet-lawdb"
            
    print(f"DSN: {new_dsn}")
    conn = psycopg2.connect(new_dsn)
    print("SUCCESS: Connected to 'privet-lawdb'!")
    conn.close()
except Exception as e:
    print(f"FAILURE: {e}")
