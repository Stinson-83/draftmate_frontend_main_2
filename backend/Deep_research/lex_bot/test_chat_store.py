"""
Test script for chat history database.
Run this after setting up the database with setup_chat_db.py.
"""
import sys
sys.path.insert(0, 'g:/draftmate_frontend_main/backend/Deep_research')

from lex_bot.memory.chat_store import ChatStore
from datetime import datetime

def test_chat_store():
    print("=== Testing Chat History Database ===\n")
    
    # Initialize
    store = ChatStore()
    if not store._initialized:
        print("[ERROR] ChatStore failed to initialize. Check DATABASE_URL in .env")
        return False
    
    print("[OK] ChatStore initialized successfully\n")
    
    # Test data
    test_user_id = "test_user_123"
    test_session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Test 1: Create session and add messages
    print("Test 1: Creating session and adding messages...")
    
    # First, create the session (required due to foreign key)
    import psycopg2
    chat_dsn = "postgresql://lawuser:Siddchick2506@127.0.0.1:5432/lexbot_chat"
    conn = psycopg2.connect(chat_dsn)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO chat_sessions (session_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (test_session_id, test_user_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    # Now add messages
    success = store.add_message(
        user_id=test_user_id,
        session_id=test_session_id,
        role="user",
        content="What is Section 498A IPC?",
        msg_metadata={"query_type": "legal_query"}
    )
    
    if not success:
        print("[FAIL] Could not add user message")
        return False
    
    success = store.add_message(
        user_id=test_user_id,
        session_id=test_session_id,
        role="assistant",
        content="Section 498A IPC deals with cruelty by husband or relatives...",
        msg_metadata={"sources": ["IPC"]}
    )
    
    if not success:
        print("[FAIL] Could not add assistant message")
        return False
    
    print("[OK] Messages added successfully\n")
    
    # Test 2: Retrieve messages
    print("Test 2: Retrieving session history...")
    history = store.get_session_history(test_user_id, test_session_id)
    
    if len(history) != 2:
        print(f"[FAIL] Expected 2 messages, got {len(history)}")
        return False
    
    print(f"[OK] Retrieved {len(history)} messages:")
    for msg in history:
        print(f"  - {msg['role']}: {msg['content'][:50]}...")
    print()
    
    # Test 3: Get user sessions
    print("Test 3: Getting user sessions...")
    sessions = store.get_user_sessions(test_user_id)
    
    if test_session_id not in sessions:
        print("[FAIL] Session not found in user sessions list")
        return False
    
    print(f"[OK] Found {len(sessions)} session(s) for user\n")
    
    # Test 4: Delete session
    print("Test 4: Deleting test session...")
    success = store.delete_session(test_user_id, test_session_id)
    
    if not success:
        print("[FAIL] Could not delete session")
        return False
    
    # Verify deletion
    history = store.get_session_history(test_user_id, test_session_id)
    if len(history) > 0:
        print("[FAIL] Session not properly deleted")
        return False
    
    print("[OK] Session deleted successfully\n")
    
    print("="*50)
    print("[SUCCESS] All tests passed!")
    print("="*50)
    return True


if __name__ == "__main__":
    try:
        test_chat_store()
    except Exception as e:
        print(f"\n[ERROR] Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
