import socket
import sys

DEST = "43.204.110.174"
PORT = 22

print(f"Connecting to {DEST}:{PORT}...", flush=True)
try:
    sock = socket.create_connection((DEST, PORT), timeout=5)
    print("SUCCESS: Connected to Bastion!", flush=True)
    sock.close()
except Exception as e:
    print(f"FAILURE: Could not connect: {e}", flush=True)
    sys.exit(1)
