import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

dsn = os.getenv("POSTGRES_DSN")
print(f"Testing connection to: {dsn}")

try:
    conn = psycopg2.connect(dsn)
    print("✅ Connection Successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection Failed: {e}")
