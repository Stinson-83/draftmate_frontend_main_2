import psycopg2
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

def check_db(db_name):
    dsn = f"postgresql://lawuser:Siddchick2506@127.0.0.1:5432/{db_name}"
    print(f"--- Checking database: {db_name} ---")
    try:
        conn = psycopg2.connect(dsn)
        with conn.cursor() as cur:
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
            tables = [r[0] for r in cur.fetchall()]
            print(f"Tables found: {tables}")
            if 'documents' in tables:
                print(f"[OK] SUCCESS: 'documents' table found in '{db_name}'")
                return True
            else:
                print(f"[WARN] '{db_name}' exists, but 'documents' table is missing.")
        conn.close()
    except Exception as e:
        print(f"[ERROR] Connection to '{db_name}' failed: {e}")
    return False

if __name__ == "__main__":
    # Check both potential names
    is_postgres = check_db("postgres")
    is_privet = check_db("privet-lawdb")
    
    if is_postgres and not is_privet:
        print("\nConclusion: Use 'postgres' in your .env")
    elif is_privet and not is_postgres:
        print("\nConclusion: Use 'privet-lawdb' in your .env")
    elif is_postgres and is_privet:
        print("\nConclusion: Both exist! Use whichever has your data.")
    else:
        print("\nConclusion: Neither could be verified. Check your SSH tunnel.")
