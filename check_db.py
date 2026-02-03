
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Use the DSN from env or fallback to the one provided
DSN = os.getenv("POSTGRES_DSN", "postgresql://lawuser:Siddchick2506@free-lawdb-useast1.cqrmc40e80ow.us-east-1.rds.amazonaws.com:5432/postgres")

print(f"Connecting to DB...")

try:
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    
    # Get all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    
    tables = cur.fetchall()
    
    print("\nExisting Tables:")
    print("----------------")
    if not tables:
        print("No tables found.")
    else:
        table_list = [t[0] for t in tables]
        for t in table_list:
            print(f"- {t}")
            
        # Optional: Check if PRO_MONTHLY plan exists
        if 'subscription_plans' in table_list:
            print("\nChecking Subscription Plans:")
            cur.execute("SELECT id, name, price FROM subscription_plans")
            plans = cur.fetchall()
            for p in plans:
                 print(f"- {p[0]}: {p[1]} ({p[2]})")

    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
