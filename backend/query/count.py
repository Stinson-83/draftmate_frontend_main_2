import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()
dsn = os.getenv("POSTGRES_DSN")
try:
    conn = psycopg2.connect(dsn)
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM documents;")
        count = cur.fetchone()[0]
        print(f"Total documents in DB: {count}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")