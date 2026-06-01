import os
import psycopg2
from dotenv import load_dotenv
import sys
from sshtunnel import SSHTunnelForwarder
import paramiko

# Monkey-patch paramiko.DSSKey for compatibility
if not hasattr(paramiko, "DSSKey"):
    class MockDSSKey:
        @classmethod
        def from_private_key_file(cls, filename, password=None):
            return None
    paramiko.DSSKey = MockDSSKey

# Load environment variables
load_dotenv()

# Configuration
POSTGRES_DSN = os.getenv("POSTGRES_DSN")
BASTION_IP = os.getenv("BASTION_IP")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT")
SSH_USER = os.getenv("SSH_USER", "ec2-user")
LOCAL_BIND_PORT = 5432

def get_db_connection():
    """Establish a database connection, using SSH tunnel if configured."""
    if BASTION_IP and SSH_KEY_PATH and RDS_ENDPOINT:
        print(f"🔒 Starting SSH tunnel via {BASTION_IP}...")
        try:
            server = SSHTunnelForwarder(
                (BASTION_IP, 22),
                ssh_username=SSH_USER,
                ssh_pkey=SSH_KEY_PATH,
                remote_bind_address=(RDS_ENDPOINT, 5432),
                local_bind_address=('127.0.0.1', LOCAL_BIND_PORT)
            )
            server.start()
            print(f"✅ Tunnel active on port {server.local_bind_port}")
            
            conn = psycopg2.connect(
                host='127.0.0.1',
                port=server.local_bind_port,
                user=os.getenv("POSTGRES_USER", "lawuser"),
                password=os.getenv("POSTGRES_PASSWORD", "Siddchick2506"),
                dbname=os.getenv("POSTGRES_DB", "postgres")
            )
            return conn, server
        except Exception as e:
            print(f"❌ Tunnel connection failed: {e}")
            raise
    else:
        print("🌍 Connecting directly...")
        if POSTGRES_DSN:
             conn = psycopg2.connect(POSTGRES_DSN)
        else:
            conn = psycopg2.connect(
                host=os.getenv("POSTGRES_HOST", "localhost"),
                dbname=os.getenv("POSTGRES_DB", "lex_bot_db"),
                user=os.getenv("POSTGRES_USER", "postgres"),
                password=os.getenv("POSTGRES_PASSWORD", "password"),
                port=os.getenv("POSTGRES_PORT", "5432")
            )
        return conn, None

def view_profiles():
    conn = None
    tunnel = None
    try:
        conn, tunnel = get_db_connection()
        cur = conn.cursor()
        
        print("\n📊 User Profiles Data:")
        print("-" * 100)
        
        cur.execute("""
            SELECT 
                p.first_name, 
                p.last_name, 
                p.role, 
                p.workplace, 
                u.email,
                p.updated_at
            FROM profiles p
            JOIN users u ON p.user_id = u.id
        """)
        
        rows = cur.fetchall()
        
        if not rows:
            print("No profiles found.")
        else:
            print(f"{'Name':<25} | {'Role':<20} | {'Workplace':<20} | {'Email':<30}")
            print("-" * 100)
            for row in rows:
                full_name = f"{row[0]} {row[1]}"
                print(f"{full_name:<25} | {row[2]:<20} | {row[3]:<20} | {row[4]:<30}")
        
        print("-" * 100)
        cur.close()
        
    except Exception as e:
        print(f"❌ Error fetching profiles: {e}")
    finally:
        if conn:
            conn.close()
        if tunnel:
            print("Stopping tunnel...")
            tunnel.stop()

if __name__ == "__main__":
    view_profiles()
