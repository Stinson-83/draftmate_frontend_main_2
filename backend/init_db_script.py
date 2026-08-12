import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def init_db():
    print("Connecting to postgres default DB to create draftmate...")
    try:
        conn = psycopg2.connect(
            host="localhost",
            dbname="postgres",
            user="postgres",
            password="password",  # Common default
            port="5432"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if DB exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname='draftmate'")
        if not cur.fetchone():
            cur.execute("CREATE DATABASE draftmate")
            print("Created draftmate database.")
        else:
            print("draftmate database already exists.")
        
        conn.close()
    except Exception as e:
        print(f"Failed to create db. Did you set a password? Error: {e}")
        return

    print("Connecting to draftmate to execute schema...")
    try:
        conn = psycopg2.connect(
            host="localhost",
            dbname="draftmate",
            user="postgres",
            password="password",
            port="5432"
        )
        cur = conn.cursor()
        
        schema_path = os.path.join(os.path.dirname(__file__), "login_db", "production_schema.sql")
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            cur.execute(schema_sql)
            conn.commit()
            print("Schema loaded successfully.")
        else:
            print(f"Could not find schema at {schema_path}")
            
        conn.close()
    except Exception as e:
        print(f"Failed to execute schema. Error: {e}")

if __name__ == "__main__":
    init_db()
