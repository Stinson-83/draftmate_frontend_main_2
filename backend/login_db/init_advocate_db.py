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
        print("Connecting directly...")
        if POSTGRES_DSN:
             conn = psycopg2.connect(POSTGRES_DSN)
        else:
            conn = psycopg2.connect(
                host=os.getenv("POSTGRES_HOST", "localhost"),
                dbname=os.getenv("POSTGRES_DB", "draftmate"),
                user=os.getenv("POSTGRES_USER", "postgres"),
                password=os.getenv("POSTGRES_PASSWORD", "password"),
                port=os.getenv("POSTGRES_PORT", "5432")
            )
        return conn, None

def init_advocate_db():
    conn = None
    tunnel = None
    try:
        conn, tunnel = get_db_connection()
        cur = conn.cursor()
        
        print("Creating Advocate Profile tables...")
        
        # 1. Advocate Profiles (Expanded)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            slug VARCHAR(255) UNIQUE NOT NULL,
            title VARCHAR(100),
            bar_council_number VARCHAR(100) UNIQUE,
            years_experience INT,
            bio TEXT,
            consultation_fee DECIMAL(10, 2),
            profile_image_url VARCHAR(500),
            banner_image_url VARCHAR(500),
            location VARCHAR(255),
            court_affiliation VARCHAR(255),
            profile_completion_score INT DEFAULT 0,
            is_verified BOOLEAN DEFAULT FALSE,
            is_public BOOLEAN DEFAULT TRUE,
            ai_trust_score INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # 2. Practice Areas
        cur.execute("""
        CREATE TABLE IF NOT EXISTS practice_areas (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL
        );
        """)

        # 3. Advocate Practice Areas (Many-to-Many)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_practice_areas (
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            practice_area_id INT REFERENCES practice_areas(id) ON DELETE CASCADE,
            is_primary BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (advocate_id, practice_area_id)
        );
        """)

        # 4. Advocate Experience
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_experience (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            company VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL,
            start_date DATE,
            end_date DATE,
            description TEXT,
            is_current BOOLEAN DEFAULT FALSE
        );
        """)

        # 5. Advocate Education
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_education (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            institution VARCHAR(255) NOT NULL,
            degree VARCHAR(255) NOT NULL,
            field_of_study VARCHAR(255),
            start_year INT,
            end_year INT
        );
        """)

        # 6. Advocate Certifications
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_certifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            issuer VARCHAR(255),
            date_issued DATE,
            credential_url VARCHAR(500)
        );
        """)

        # 7. Advocate Languages
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_languages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            language VARCHAR(100) NOT NULL,
            proficiency VARCHAR(50)
        );
        """)

        # 8. Advocate Social Links
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_social_links (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            platform VARCHAR(50) NOT NULL,
            url VARCHAR(500) NOT NULL
        );
        """)

        # 9. Advocate Publications
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_publications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            publisher VARCHAR(255),
            publication_date DATE,
            link VARCHAR(500)
        );
        """)

        # 10. Advocate Cases
        cur.execute("""
        CREATE TABLE IF NOT EXISTS advocate_cases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            case_name VARCHAR(255) NOT NULL,
            court VARCHAR(255),
            year INT,
            description TEXT,
            outcome VARCHAR(255)
        );
        """)

        # 11. Professional Achievements
        cur.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            type VARCHAR(50),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            date_achieved DATE,
            proof_url VARCHAR(255),
            is_verified BOOLEAN DEFAULT FALSE
        );
        """)

        # 12. Bookmarks
        cur.execute("""
        CREATE TABLE IF NOT EXISTS bookmarks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, advocate_id)
        );
        """)

        # 13. Consultation Requests
        cur.execute("""
        CREATE TABLE IF NOT EXISTS consultation_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id),
            client_name VARCHAR(255),
            client_email VARCHAR(255),
            client_phone VARCHAR(50),
            case_summary TEXT,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 14. Verification Requests
        cur.execute("""
        CREATE TABLE IF NOT EXISTS verification_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            documents_url TEXT,
            status VARCHAR(50) DEFAULT 'PENDING',
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP
        );
        """)

        # 15. Moderation Reports
        cur.execute("""
        CREATE TABLE IF NOT EXISTS moderation_reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            reason TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 16. Profile Views (Analytics)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS profile_views (
            id BIGSERIAL PRIMARY KEY,
            advocate_id UUID REFERENCES advocate_profiles(id),
            viewer_ip VARCHAR(45),
            source VARCHAR(255),
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Indexes
        cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_advocate_slug ON advocate_profiles(slug);
        CREATE INDEX IF NOT EXISTS idx_advocate_verified ON advocate_profiles(is_verified) WHERE is_public = true;
        """)
        
        conn.commit()
        print("✅ Advocate Profile tables created successfully.")
        
        cur.close()
        
    except Exception as e:
        print(f"❌ Error initializing advocate database: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
        if tunnel:
            print("Stopping tunnel...")
            tunnel.stop()

if __name__ == "__main__":
    init_advocate_db()
