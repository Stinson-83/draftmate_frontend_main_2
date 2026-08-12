import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://draftmate_user:draftmate_password@localhost:5432/draftmate_db")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM advocate_profiles")
    print("Total advocate_profiles:", cur.fetchone()[0])
    
    cur.execute("SELECT COUNT(*) FROM advocate_profiles WHERE is_public = TRUE")
    print("Total public advocate_profiles:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM advocate_profiles WHERE is_public = FALSE OR is_public IS NULL")
    print("Total NOT public advocate_profiles:", cur.fetchone()[0])

    cur.execute("UPDATE advocate_profiles SET is_public = TRUE")
    conn.commit()
    print("Updated all profiles to is_public = TRUE")

    conn.close()
except Exception as e:
    print("Error:", e)
