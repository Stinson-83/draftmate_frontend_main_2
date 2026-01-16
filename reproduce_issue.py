import requests
import json

# 1. Create a user and login to get a valid session_id
auth_url = "http://localhost:8080/auth"
register_url = f"{auth_url}/register"
login_url = f"{auth_url}/login"

email = "test_stream_user@example.com"
password = "password123"

# Try to register (ignore if already exists)
try:
    requests.post(register_url, json={"email": email, "password": password})
except:
    pass

# Login
print("Logging in...")
login_resp = requests.post(login_url, json={"email": email, "password": password})
if login_resp.status_code != 200:
    print(f"Login failed: {login_resp.text}")
    exit(1)

session_id = login_resp.json().get("session_id")
print(f"Got session_id: {session_id}")

# 2. Test the stream with valid session
url = "http://localhost:8080/lexbot/chat/stream"
headers = {"Content-Type": "application/json"}
data = {
    "query": "what are the laws related to drugs",
    "session_id": session_id
}

print(f"Connecting to {url}...")
try:
    response = requests.post(url, json=data, headers=headers, stream=True)
    print(f"Response Status: {response.status_code}")
    
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            print(f"Received: {decoded_line}")
            if decoded_line.startswith("data: "):
                try:
                    json_data = json.loads(decoded_line[6:])
                    event = json_data.get('event')
                    print(f"Event Type: {event}")
                    if event == 'error':
                        print("ERROR EVENT DETECTED")
                    if event == 'done':
                        print("DONE EVENT DETECTED")
                        break
                except json.JSONDecodeError:
                    print("Failed to parse JSON")
except Exception as e:
    print(f"Exception: {e}")

# 3. Test Follow-up Question
print("\n--- Testing Follow-up Question ---")
followup_data = {
    "query": "what did you mean by small quantity?",
    "session_id": session_id
}

print(f"Connecting to {url} for follow-up...")
try:
    response = requests.post(url, json=followup_data, headers=headers, stream=True)
    print(f"Response Status: {response.status_code}")
    
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            print(f"Received: {decoded_line}")
            if decoded_line.startswith("data: "):
                try:
                    json_data = json.loads(decoded_line[6:])
                    event = json_data.get('event')
                    if event == 'error':
                        print("ERROR EVENT DETECTED")
                    if event == 'done':
                        print("DONE EVENT DETECTED")
                        break
                except json.JSONDecodeError:
                    pass
except Exception as e:
    print(f"Exception: {e}")
