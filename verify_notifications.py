import requests
import time
import sys

BASE_URL = "http://localhost:8015"
USER_ID = "test_user_verification"

def log(msg, status="INFO"):
    colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m",
        "ERROR": "\033[91m",
        "RESET": "\033[0m"
    }
    print(f"{colors.get(status, '')}[{status}] {msg}{colors['RESET']}")

def verify_backend():
    log("Starting Notification Backend Verification...", "INFO")

    # 1. Health Check
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            log("Health check passed", "SUCCESS")
        else:
            log(f"Health check failed: {response.status_code}", "ERROR")
            return
    except requests.exceptions.ConnectionError:
        log("Could not connect to backend. Is it running on port 8015?", "ERROR")
        return

    # 2. Create Notification
    try:
        payload = {
            "user_id": USER_ID,
            "type": "system",
            "title": "Verification Test",
            "message": "This is a test notification to verify backend linkage.",
            "metadata": {"source": "verification_script"}
        }
        response = requests.post(f"{BASE_URL}/notifications", json=payload)
        if response.status_code == 201:
            notif = response.json()
            notif_id = notif['id']
            log(f"Created notification: {notif_id}", "SUCCESS")
        else:
            log(f"Create notification failed: {response.status_code} - {response.text}", "ERROR")
            return
    except Exception as e:
        log(f"Create notification exception: {str(e)}", "ERROR")
        return

    # 3. Get Notifications
    try:
        response = requests.get(f"{BASE_URL}/notifications/{USER_ID}")
        if response.status_code == 200:
            notifs = response.json()
            found = any(n['id'] == notif_id for n in notifs)
            if found:
                log("Notification found in list", "SUCCESS")
            else:
                log("Notification NOT found in list", "ERROR")
                return
        else:
            log(f"Get notifications failed: {response.status_code}", "ERROR")
            return
    except Exception as e:
        log(f"Get notifications exception: {str(e)}", "ERROR")
        return

    # 4. Mark as Read
    try:
        response = requests.patch(f"{BASE_URL}/notifications/{notif_id}/read")
        if response.status_code == 200:
            if response.json()['read'] is True:
                log("Marked notification as read", "SUCCESS")
            else:
                log("Notification read status is False after update", "ERROR")
        else:
            log(f"Mark read failed: {response.status_code}", "ERROR")
    except Exception as e:
        log(f"Mark read exception: {str(e)}", "ERROR")

    # 5. Delete Notification
    try:
        response = requests.delete(f"{BASE_URL}/notifications/{notif_id}")
        if response.status_code == 200:
            log("Deleted notification", "SUCCESS")
        else:
            log(f"Delete failed: {response.status_code}", "ERROR")
    except Exception as e:
        log(f"Delete exception: {str(e)}", "ERROR")

    log("Verification Complete! Backend is linked and functioning correctly.", "SUCCESS")

if __name__ == "__main__":
    verify_backend()
