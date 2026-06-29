import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import json

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def audit():
    print("=== PHASE 1: DATABASE AUDIT ===")
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        dbname=os.getenv("POSTGRES_DB", "draftmate"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        cursor_factory=RealDictCursor
    )
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) as count FROM advocate_profiles")
    print(f"Total Advocate Profiles: {cur.fetchone()['count']}")
    
    cur.execute("SELECT * FROM advocate_profiles LIMIT 1")
    advocate = cur.fetchone()
    print("Sample Advocate Profile (JSON):")
    # Convert datetime to string for json serialization
    if advocate and 'created_at' in advocate:
        advocate['created_at'] = advocate['created_at'].isoformat()
    if advocate and 'updated_at' in advocate:
        advocate['updated_at'] = advocate['updated_at'].isoformat()
    print(json.dumps(advocate, indent=2))
    
    cur.execute("SELECT * FROM practice_areas LIMIT 1")
    pa = cur.fetchone()
    print("Sample Practice Area:")
    print(json.dumps(pa, indent=2))
    
    cur.execute("SELECT * FROM profile_views LIMIT 1")
    pv = cur.fetchone()
    if pv and 'viewed_at' in pv:
        pv['viewed_at'] = pv['viewed_at'].isoformat()
    print("Sample Analytics Record:")
    print(json.dumps(pv, indent=2))
    
    conn.close()

if __name__ == "__main__":
    audit()
