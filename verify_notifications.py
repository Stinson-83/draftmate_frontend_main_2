import requests
import uuid
import time

BASE_URL = "http://localhost:8080/notification"

def test_health():
    print("Testing Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health Check Passed:", response.json())
            return True
        else:
            print(f"❌ Health Check Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
        return False

def test_create_notification():
    print("\nTesting Create Notification...")
    user_id = "test_user_123"
    payload = {
        "type": "system",
        "title": "Test Notification",
        "message": "This is a test notification from the verification script.",
        "user_id": user_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/notifications", json=payload)
        if response.status_code == 201:
            data = response.json()
            print("✅ Create Notification Passed:", data)
            return data['id'], user_id
        else:
            print(f"❌ Create Notification Failed: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Create Notification Error: {e}")
        return None, None

def test_get_notifications(user_id):
    print(f"\nTesting Get Notifications for user {user_id}...")
    try:
        response = requests.get(f"{BASE_URL}/notifications/{user_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get Notifications Passed. Found {len(data)} notifications.")
            return True
        else:
            print(f"❌ Get Notifications Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Get Notifications Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Notification Service Verification...")
    print("Ensure your Docker container is running with the latest nginx.conf changes.")
    print("Run: ./test_docker_local.sh\n")
    
    if test_health():
        notif_id, user_id = test_create_notification()
        if notif_id:
            test_get_notifications(user_id)
    
    print("\nVerification Complete.")
