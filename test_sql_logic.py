import os
import sys

# Mock environment variables
os.environ["POSTGRES_DSN"] = "postgresql://user:pass@db-host:5432/dbname"
os.environ.pop("BASTION_IP", None) # Ensure BASTION_IP is unset

# Add backend to path
sys.path.append(os.path.abspath("backend"))

from query.sql import _get_tunneled_dsn

def test_dsn_logic():
    print("Testing DSN logic with NO bastion...")
    dsn = _get_tunneled_dsn()
    print(f"Resulting DSN: {dsn}")
    
    expected = "postgresql://user:pass@db-host:5432/dbname"
    if dsn == expected:
        print("✅ SUCCESS: DSN was NOT rewritten.")
    else:
        print(f"❌ FAILURE: DSN was rewritten to {dsn}")
        sys.exit(1)

if __name__ == "__main__":
    test_dsn_logic()
