from main import get_db_connection

def update():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS preferred_type VARCHAR(50);")
        cur.execute("ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS preferred_date TIMESTAMP;")
        
        cur.execute("""
        CREATE TABLE IF NOT EXISTS contact_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id),
            client_name VARCHAR(255),
            client_email VARCHAR(255),
            message TEXT,
            status VARCHAR(50) DEFAULT 'UNREAD',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        conn.commit()
        print("Schema updated successfully.")
    except Exception as e:
        print("Error:", e)
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    update()
