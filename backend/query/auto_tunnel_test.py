
import os
import sys
import paramiko
# Monkey-patch paramiko.DSSKey for compatibility
if not hasattr(paramiko, "DSSKey"):
    class MockDSSKey:
        @classmethod
        def from_private_key_file(cls, filename, password=None):
            return None
    paramiko.DSSKey = MockDSSKey

from sshtunnel import SSHTunnelForwarder
from dotenv import load_dotenv

# Load env vars
load_dotenv()

BASTION_IP = os.getenv("BASTION_IP", "43.204.110.174")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH", r"c:\Users\Dell\Downloads\bastion.key.pem")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT", "privet-lawdb.cfge8ai08o3t.ap-south-1.rds.amazonaws.com")
SSH_USER = os.getenv("SSH_USER", "ec2-user")

print(f"Paramiko Version: {paramiko.__version__}")
print(f"Python Version: {sys.version}")

def test_tunnel():
    print(f"Attempting to connect to {BASTION_IP} as {SSH_USER}...")
    
    try:
        tunnel = SSHTunnelForwarder(
            (BASTION_IP, 22),
            ssh_username=SSH_USER,
            ssh_pkey=SSH_KEY_PATH,
            remote_bind_address=(RDS_ENDPOINT, 5432),
            # local_bind_address=('127.0.0.1', 5432)  
            local_bind_address=('127.0.0.1', 5432) # as my pql server was on port 5432
        )
        tunnel.start()
        print(f"[SUCCESS] Auto-tunnel SUCCESS! Port: {tunnel.local_bind_port}")
        tunnel.stop()
    except Exception as e:
        print(f"[FAILED] Auto-tunnel FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_tunnel()
