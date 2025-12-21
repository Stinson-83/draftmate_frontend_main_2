"""
Setup script for LexBot chat history database.
This creates a new database 'lexbot_chat' in your existing RDS instance.
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv()

# Connection to the default 'postgres' database (to create new DB)
POSTGRES_DSN = os.getenv("POSTGRES_DSN", "postgresql://lawuser:Siddchick2506@127.0.0.1:5432/postgres")

def create_database():
    """Create the lexbot_chat database if it doesn't exist."""
    print("Step 1: Creating lexbot_chat database...")
    
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(POSTGRES_DSN)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname='lexbot_chat'")
        exists = cur.fetchone()
        
        if exists:
            print("  [INFO] Database 'lexbot_chat' already exists")
        else:
            cur.execute("CREATE DATABASE lexbot_chat")
            print("  [SUCCESS] Database 'lexbot_chat' created successfully")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"  [ERROR] Failed to create database: {e}")
        raise


def create_schema():
    """Create tables and indexes for chat history."""
    print("\nStep 2: Creating schema (tables and indexes)...")
    
    # Connect to the new lexbot_chat database
    chat_dsn = POSTGRES_DSN.replace("/postgres", "/lexbot_chat")
    
    try:
        conn = psycopg2.connect(chat_dsn)
        cur = conn.cursor()
        
        # Create chat_sessions table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                session_id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                metadata JSONB DEFAULT '{}'::jsonb
            )
        """)
        print("  [SUCCESS] Table 'chat_sessions' created")
        
        # Create chat_messages table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                session_id VARCHAR(255) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                content TEXT NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                msg_metadata JSONB DEFAULT '{}'::jsonb
            )
        """)
        print("  [SUCCESS] Table 'chat_messages' created")
        
        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp)")
        print("  [SUCCESS] Indexes created")
        
        conn.commit()
        cur.close()
        conn.close()
        
        print("\n[SUCCESS] Chat database setup complete!")
        print(f"\nConnection string for .env:")
        print(f"CHAT_DB_DSN={chat_dsn}")
        
    except Exception as e:
        print(f"  [ERROR] Failed to create schema: {e}")
        raise


if __name__ == "__main__":
    print("=== LexBot Chat Database Setup ===\n")
    print("This will create a new database 'lexbot_chat' in your RDS instance.")
    print("Make sure your SSH tunnel is active or auto-tunnel is working.\n")
    
    try:
        create_database()
        create_schema()
    except Exception as e:
        print(f"\n[FATAL] Setup failed: {e}")
        exit(1)
