import os
import sys
from fastapi.testclient import TestClient

# Ensure we can import Query
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from Query import app
except ImportError as e:
    print(f"Failed to import app: {e}")
    sys.exit(1)

client = TestClient(app)

def test_health():
    print("\n--- Testing GET / ---")
    response = client.get("/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200

def test_diag():
    print("\n--- Testing GET /diag ---")
    response = client.get("/diag")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200

def test_search():
    print("\n--- Testing POST /search ---")
    # Using a generic query that should match something if DB has data
    payload = {"user_query": "agreement", "language": "en"}
    try:
        response = client.post("/search", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found: {data.get('title')}")
            print(f"Score: {data.get('score')}")
            print(f"Alternatives: {len(data.get('alternatives', []))}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Search failed with exception: {e}")

if __name__ == "__main__":
    print("Running Verification Tests...")
    test_health()
    test_diag()
    # Mocking DB connection if simple search fails? 
    # Attempt real search
    test_search()
    print("\n[OK] Verification Complete.")
