import os
import sys
import paramiko
import psycopg2
from sshtunnel import SSHTunnelForwarder
from dotenv import load_dotenv
from urllib.parse import urlparse

# Monkey-patch paramiko.DSSKey for compatibility
if not hasattr(paramiko, "DSSKey"):
    class MockDSSKey:
        @classmethod
        def from_private_key_file(cls, filename, password=None):
            return None
    paramiko.DSSKey = MockDSSKey

# Load env vars
load_dotenv()

BASTION_IP = os.getenv("BASTION_IP", "43.204.110.174")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH", r"c:\Users\Dell\Downloads\bastion.key.pem")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT", "privet-lawdb.cfge8ai08o3t.ap-south-1.rds.amazonaws.com")
SSH_USER = os.getenv("SSH_USER", "ec2-user")
POSTGRES_DSN = os.getenv("POSTGRES_DSN")

def check_db():
    if not POSTGRES_DSN:
        print("[ERROR] POSTGRES_DSN not found in .env")
        return

    # Parse DSN to get creds
    try:
        parsed = urlparse(POSTGRES_DSN)
        db_user = parsed.username
        db_pass = parsed.password
        db_name = parsed.path.lstrip('/')
    except Exception as e:
        print(f"[ERROR] Could not parse POSTGRES_DSN: {e}")
        return

    print(f"Attempting to connect to {BASTION_IP} and query DB...")
    
    try:
        with SSHTunnelForwarder(
            (BASTION_IP, 22),
            ssh_username=SSH_USER,
            ssh_pkey=SSH_KEY_PATH,
            remote_bind_address=(RDS_ENDPOINT, 5432),
            local_bind_address=('127.0.0.1', 5432) 
        ) as tunnel:
            print(f"[SUCCESS] Tunnel established on port {tunnel.local_bind_port}")
            
            # Connect to DB via tunnel
            conn = psycopg2.connect(
                dbname=db_name,
                user=db_user,
                password=db_pass,
                host='127.0.0.1',
                port=tunnel.local_bind_port
            )
            
            cursor = conn.cursor()
            
            # Check for documents table
            cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents');")
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                print(f"\n[RESULT] Table 'documents' DOES NOT EXIST.")
                print("The database appears to be empty or not initialized.")
            else:
                cursor.execute("SELECT COUNT(*) FROM documents;")
                count = cursor.fetchone()[0]
                print(f"\n[RESULT] Table 'documents' exists.")
                print(f"Total rows in 'documents': {count}")
                if count == 0:
                    print("The table is empty.")
                else:
                    print("The database is POPULATED.")

            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"[FAILED] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_db()
