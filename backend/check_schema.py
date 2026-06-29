import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
conn = psycopg2.connect(os.getenv('POSTGRES_DSN'))
cur = conn.cursor()

def check_schema(table_name):
    cur.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table_name}'")
    print(f"--- {table_name} ---")
    for row in cur.fetchall():
        print(row)

check_schema('consultation_requests')
check_schema('contact_requests')
check_schema('verification_requests')

conn.close()
