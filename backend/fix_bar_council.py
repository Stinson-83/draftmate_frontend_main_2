import psycopg2
from dotenv import load_dotenv
import os
import random

load_dotenv()

conn = psycopg2.connect(os.getenv('POSTGRES_DSN'))
cur = conn.cursor()

# Get all advocates
cur.execute("SELECT id FROM advocate_profiles WHERE bar_council_number IS NULL")
rows = cur.fetchall()

for row in rows:
    adv_id = row[0]
    fake_bcn = f"D/{random.randint(1000, 9999)}/{random.randint(2000, 2023)}"
    cur.execute("UPDATE advocate_profiles SET bar_council_number = %s WHERE id = %s", (fake_bcn, adv_id))

conn.commit()
conn.close()
print("Updated all missing bar council numbers successfully.")
