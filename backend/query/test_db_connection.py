import os
import sys
import time
from dotenv import load_dotenv

# Add current directory to path to allow importing sql
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import sql

# Load environment variables
load_dotenv()

def test_connection():
    print("Testing Database Connection with Tunnel Support...")
    
    dsn = os.getenv("POSTGRES_DSN")
    if not dsn:
        print("❌ Error: POSTGRES_DSN not found in .env")
        return

    print(f"Original DSN: {dsn[:15]}... (masked)")
    
    # Check Bastion
    bastion = os.getenv("BASTION_IP")
    if bastion:
        print(f"Bastion IP configured: {bastion}")
        print("Attempting to start tunnel...")
        try:
            sql.start_tunnel_and_pool()
            if sql.tunnel:
                print(f"✅ Tunnel started on local port {sql.tunnel.local_bind_port}")
            else:
                print("⚠️ Tunnel did not start (maybe not needed or failed silently?)")
        except Exception as e:
            print(f"❌ Tunnel start failed: {e}")
            return
    else:
        print("No Bastion IP configured. Using direct connection.")

    # Test Connection via sql module
    print("Getting connection from pool/direct...")
    try:
        conn = sql.get_db_connection()
        print("✅ Successfully connected to the database!")
        
        # Try a simple query
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print(f"Database Version: {version[0]}")
            
        sql.release_db_connection(conn)
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        sql.stop_tunnel_and_pool()

if __name__ == "__main__":
    test_connection()
