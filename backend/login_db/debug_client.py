import requests
import json

try:
    print("Testing / ...")
    r = requests.get("http://localhost:8009/")
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

    print("\nTesting /register ...")
    r = requests.post("http://localhost:8009/register", 
                      json={"email": "debug_test@example.com", "password": "password123"})
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")
