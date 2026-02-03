
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Force local connection parameters for Docker
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = os.getenv("POSTGRES_DB", "lex_bot_db")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "password")

def update_schema():
    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        # Create subscription_plans table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            interval VARCHAR(20) DEFAULT 'monthly',
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
            order_id VARCHAR(255) UNIQUE NOT NULL,
            reference_id VARCHAR(255),
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            status VARCHAR(50) DEFAULT 'PENDING',
            payment_method VARCHAR(100),
            payment_time TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        conn.commit()
        print("✅ Tables created.")

        # Insert Default Plans
        cur.execute("SELECT id FROM subscription_plans WHERE id = 'PRO_MONTHLY'")
        if not cur.fetchone():
            print("Inserting PRO_MONTHLY plan...")
            cur.execute("""
                INSERT INTO subscription_plans (id, name, price, interval, features)
                VALUES (%s, %s, %s, %s, %s)
            """, ('PRO_MONTHLY', 'PRO', 599.00, 'monthly', '["AI-Powered Drafting", "Case Law Database", "Standard Support", "5GB Storage"]'))
            conn.commit()
            print("✅ PRO plan inserted.")
        else:
            print("ℹ️ PRO plan exists.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_schema()
