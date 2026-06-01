import os
import psycopg2
from dotenv import load_dotenv
import sys
from sshtunnel import SSHTunnelForwarder
import paramiko

# Monkey-patch paramiko.DSSKey for compatibility with sshtunnel + paramiko 3.0+
if not hasattr(paramiko, "DSSKey"):
    class MockDSSKey:
        @classmethod
        def from_private_key_file(cls, filename, password=None):
            return None
    paramiko.DSSKey = MockDSSKey

# Load environment variables
load_dotenv()

# Configuration
POSTGRES_DSN = os.getenv("POSTGRES_DSN")
BASTION_IP = os.getenv("BASTION_IP")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT")
SSH_USER = os.getenv("SSH_USER", "ec2-user")
LOCAL_BIND_PORT = 5432

def get_db_connection():
    """Establish a database connection, using SSH tunnel if configured."""
    # Check if we need to use SSH tunnel
    if BASTION_IP and SSH_KEY_PATH and RDS_ENDPOINT:
        print(f"🔒 Starting SSH tunnel via {BASTION_IP}...")
        try:
            server = SSHTunnelForwarder(
                (BASTION_IP, 22),
                ssh_username=SSH_USER,
                ssh_pkey=SSH_KEY_PATH,
                remote_bind_address=(RDS_ENDPOINT, 5432),
                local_bind_address=('127.0.0.1', LOCAL_BIND_PORT)
            )
            server.start()
            print(f"✅ Tunnel active on port {server.local_bind_port}")
            
            # Connect to local forwarded port
            conn = psycopg2.connect(
                host='127.0.0.1',
                port=server.local_bind_port,
                user=os.getenv("POSTGRES_USER", "lawuser"),
                password=os.getenv("POSTGRES_PASSWORD", "Siddchick2506"),
                dbname=os.getenv("POSTGRES_DB", "postgres")
            )
            return conn, server
        except Exception as e:
            print(f"❌ Tunnel connection failed: {e}")
            raise
    else:
        # Direct connection (using DSN or env vars)
        print("🌍 Connecting directly...")
        if POSTGRES_DSN:
             conn = psycopg2.connect(POSTGRES_DSN)
        else:
            conn = psycopg2.connect(
                host=os.getenv("POSTGRES_HOST", "localhost"),
                dbname=os.getenv("POSTGRES_DB", "lex_bot_db"),
                user=os.getenv("POSTGRES_USER", "postgres"),
                password=os.getenv("POSTGRES_PASSWORD", "password"),
                port=os.getenv("POSTGRES_PORT", "5432")
            )
        return conn, None

def init_db():
    conn = None
    tunnel = None
    try:
        conn, tunnel = get_db_connection()
        cur = conn.cursor()
        
        print("Creating tables...")
        
        # Create users table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            google_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Create sessions table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        conn.commit()
        print("✅ Tables created successfully.")

        # Create profiles table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            role VARCHAR(100),
            workplace VARCHAR(100),
            bio TEXT,
            profile_image_url TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        conn.commit()
        print("✅ Profiles table created successfully.")

        # Create subscription_plans table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            interval VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
            features JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Create user_subscriptions table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS user_subscriptions (
            subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            plan_id VARCHAR(50) REFERENCES subscription_plans(id),
            status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'inactive', 'expired'
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            auto_renew BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Create payments table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            order_id VARCHAR(255) UNIQUE NOT NULL, -- Cashfree Order ID
            reference_id VARCHAR(255), -- Cashfree Reference ID
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            status VARCHAR(50) DEFAULT 'PENDING',
            payment_method VARCHAR(100),
            payment_time TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        conn.commit()
        print("✅ Subscription tables created successfully.")

        # Insert Default Plans (Manual Renewal Model)
        print("Checking default plans...")
        cur.execute("SELECT id FROM subscription_plans WHERE id = 'PRO_MONTHLY'")
        if not cur.fetchone():
            print("Inserting PRO_MONTHLY plan...")
            cur.execute("""
                INSERT INTO subscription_plans (id, name, price, interval, features)
                VALUES (%s, %s, %s, %s, %s)
            """, ('PRO_MONTHLY', 'PRO', 599.00, 'monthly', '["AI-Powered Drafting", "Case Law Database", "Standard Support", "5GB Storage"]'))
            conn.commit()
        else:
            print("PRO_MONTHLY plan already exists.")
        
        cur.close()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
    finally:
        if conn:
            conn.close()
        if tunnel:
            print("Stopping tunnel...")
            tunnel.stop()

if __name__ == "__main__":
    init_db()
