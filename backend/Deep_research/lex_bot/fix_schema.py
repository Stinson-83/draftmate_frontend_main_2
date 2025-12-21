"""
Drop and recreate chat tables with correct schema.
Run this to fix the schema mismatch.
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

POSTGRES_DSN = os.getenv("POSTGRES_DSN", "postgresql://lawuser:Siddchick2506@127.0.0.1:5432/postgres")
chat_dsn = POSTGRES_DSN.replace("/postgres", "/lexbot_chat")

print("=== Fixing Chat Database Schema ===\n")
print("This will DROP and RECREATE the chat tables.\n")

try:
    conn = psycopg2.connect(chat_dsn)
    cur = conn.cursor()
    
    # Drop existing tables (CASCADE removes dependencies)
    print("Dropping old tables...")
    cur.execute("DROP TABLE IF EXISTS chat_messages CASCADE")
    cur.execute("DROP TABLE IF EXISTS chat_sessions CASCADE")
    print("[OK] Old tables dropped\n")
    
    # Recreate with correct schema
    print("Creating tables with correct schema...")
    
    cur.execute("""
        CREATE TABLE chat_sessions (
            session_id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'::jsonb
        )
    """)
    print("[OK] Created chat_sessions")
    
    cur.execute("""
        CREATE TABLE chat_messages (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            session_id VARCHAR(255) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            msg_metadata JSONB DEFAULT '{}'::jsonb
        )
    """)
    print("[OK] Created chat_messages")
    
    # Create indexes
    print("\nCreating indexes...")
    cur.execute("CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id)")
    cur.execute("CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at)")
    cur.execute("CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id)")
    cur.execute("CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id)")
    cur.execute("CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp)")
    print("[OK] Indexes created")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("\n[SUCCESS] Schema fixed! Now run: python test_chat_store.py")
    
except Exception as e:
    print(f"[ERROR] {e}")
