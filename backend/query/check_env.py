import os
from dotenv import load_dotenv, find_dotenv

# Try straightforward load
load_dotenv()
dsn = os.getenv("POSTGRES_DSN")

print(f"Debug: load_dotenv() result -> DSN found: {bool(dsn)}")

if not dsn:
    # Try finding it explicitly
    env_path = find_dotenv()
    print(f"Debug: find_dotenv() found: '{env_path}'")
    if env_path:
        load_dotenv(env_path)
        dsn = os.getenv("POSTGRES_DSN")
        print(f"Debug: After explicit load -> DSN found: {bool(dsn)}")

if dsn:
    clean_dsn = dsn.replace(dsn.split("@")[0], "postgresql://****:****") if "@" in dsn else "Check format but sensitive"
    print(f"✅ Environment looks good. DSN format: {clean_dsn}")
else:
    print("❌ POSTGRES_DSN is MISSING or None.")
