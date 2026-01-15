import requests
import json
import time
import uuid

# Configuration
BASE_URL = "http://localhost:8004"
CHAT_URL = f"{BASE_URL}/chat"
SESSION_ID = f"test_session_{uuid.uuid4().hex[:8]}"
USER_ID = "test_user_repro"

def send_query(query, session_id):
    print(f"\n🔹 Sending Query: '{query}'")
    payload = {
        "query": query,
        "user_id": USER_ID,
        "session_id": session_id
    }
    headers = {
        "Authorization": f"Bearer {session_id}"
    }
    try:
        start_time = time.time()
        response = requests.post(CHAT_URL, json=payload, headers=headers)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            answer = data.get("answer", "")
            print(f"✅ Response ({duration:.2f}s):")
            print(f"   {answer[:200]}..." if len(answer) > 200 else f"   {answer}")
            return answer
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def main():
    print(f"🚀 Starting History Reproduction Test (Session: {SESSION_ID})")
    
    # 1. First Query: Establish Context
    q1 = "What are the laws related to share market in India?"
    ans1 = send_query(q1, SESSION_ID)
    
    if not ans1:
        print("❌ Failed to get first response. Aborting.")
        return

    # 2. Follow-up Query: Relies on Context
    # The issue is that the bot forgets "share market" and asks for "subject matter".
    q2 = "Are there any other acts related to this which you did not mention?"
    ans2 = send_query(q2, SESSION_ID)
    
    if not ans2:
        print("❌ Failed to get second response.")
        return

    # 3. Check for failure patterns
    failure_keywords = [
        "subject matter of our discussion",
        "list of acts that have already been mentioned",
        "without this crucial information",
        "please specify",
        "context is missing"
    ]
    
    failed = False
    for kw in failure_keywords:
        if kw.lower() in ans2.lower():
            failed = True
            print(f"\n⚠️  ISSUE REPRODUCED: Found failure keyword '{kw}'")
            break
            
    if not failed:
        print("\n✅  No obvious failure keywords found. Check response content manually.")
    else:
        print("\n❌  Test Failed: Context was lost.")

if __name__ == "__main__":
    main()
