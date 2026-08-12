import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load .env from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def verify_connection():
    print("Testing connection using POSTGRES_DSN...")
    dsn = os.getenv("POSTGRES_DSN")
    
    if dsn:
        print(f"Found DSN: {dsn.replace(os.getenv('POSTGRES_PASSWORD', 'hidden'), '******')}")
        try:
            conn = psycopg2.connect(dsn)
            print("✅ SUCCESS: Connected via POSTGRES_DSN")
            conn.close()
            return
        except Exception as e:
            print(f"❌ FAILED to connect via DSN: {e}")
    else:
        print("No POSTGRES_DSN found.")
        
    print("\nTesting connection using individual POSTGRES_* environment variables...")
    try:
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            dbname=os.getenv("POSTGRES_DB", "draftmate"),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", "password"),
            port=os.getenv("POSTGRES_PORT", "5432")
        )
        print("✅ SUCCESS: Connected via individual POSTGRES_* variables")
        conn.close()
    except Exception as e:
        print(f"❌ FAILED to connect via individual variables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_connection()
