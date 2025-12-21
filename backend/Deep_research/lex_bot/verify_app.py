import sys
import os
from fastapi.testclient import TestClient

# Adjust path to find lex_bot
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from lex_bot.app import app

client = TestClient(app)

def test_health():
    response = client.get("/")
    print(f"Health Check: {response.status_code} - {response.json()}")

def test_chat():
    print("Testing Chat Endpoint...")
    try:
        response = client.post("/chat", json={"query": "What is Article 21? answer in points"})
        if response.status_code == 200:
            print("✅ Chat Success")
            data = response.json()
            print(f"Answer Preview: {data['answer']}...")
        else:
            print(f"❌ Chat Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_health()
    test_chat()
