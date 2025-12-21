import requests
import json
import time

url = "http://localhost:8004/chat"
payload = {
    "query": "Compare the penalty for theft vs robbery and cite relevant supreme court judgments.",
    "user_id": "test_user",
    "session_id": "test_session"
}
headers = {
    "Content-Type": "application/json"
}

# Wait for server to start
time.sleep(5)

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
