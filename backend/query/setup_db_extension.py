import os
import sys
import psycopg2
import re
from dotenv import load_dotenv
import paramiko
from sshtunnel import SSHTunnelForwarder

# Monkey-patch paramiko
if not hasattr(paramiko, "DSSKey"):
    class MockDSSKey:
        @classmethod
        def from_private_key_file(cls, filename, password=None):
            return None
    paramiko.DSSKey = MockDSSKey

load_dotenv()

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
BASTION_IP = os.getenv("BASTION_IP")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT", "privet-lawdb.cfge8ai08o3t.ap-south-1.rds.amazonaws.com")
SSH_USER = "ec2-user"

def get_tunneled_dsn(dsn):
    if not dsn: return None
    if "localhost" in dsn:
        dsn = dsn.replace("localhost", "127.0.0.1")
    if RDS_ENDPOINT in dsn:
        dsn = dsn.replace(RDS_ENDPOINT, "127.0.0.1")
    elif "amazonaws.com" in dsn:
        dsn = re.sub(r'@[^:]+:5432', '@127.0.0.1:5432', dsn)
    return dsn

def enable_extension():
    server = None
    try:
        print(f"Starting tunnel to {BASTION_IP}...")
        server = SSHTunnelForwarder(
            (BASTION_IP, 22),
            ssh_username=SSH_USER,
            ssh_pkey=SSH_KEY_PATH,
            remote_bind_address=(RDS_ENDPOINT, 5432),
            local_bind_address=('127.0.0.1', 5432)
        )
        server.start()
        print(f"Tunnel established on port {server.local_bind_port}.")

        # Connect to DB via local tunnel port
        dsn = get_tunneled_dsn(POSTGRES_DSN)
        print(f"Connecting to DB...")
        
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Enabling pg_trgm extension...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        print("Success! pg_trgm enabled.")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if server:
            server.stop()
            print("Tunnel closed.")

if __name__ == "__main__":
    enable_extension()
