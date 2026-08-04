import os
import uuid
import psycopg2
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv
import bcrypt
import jwt
import requests
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Load environment variables from the root .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Connection
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

# Configuration
POSTGRES_DSN = os.getenv("POSTGRES_DSN")
BASTION_IP = os.getenv("BASTION_IP")
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")
RDS_ENDPOINT = os.getenv("RDS_ENDPOINT")
SSH_USER = os.getenv("SSH_USER", "ec2-user")
LOCAL_BIND_PORT = 5432
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-this")
ALGORITHM = "HS256"

# Global tunnel reference to keep it alive
_tunnel = None

import sqlite3

class SQLitePooledConnectionProxy:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.execute("PRAGMA foreign_keys = ON")
    def cursor(self, *args, **kwargs):
        cur = self.conn.cursor()
        class SQLiteCursorAdapter:
            def __init__(self, c):
                self.c = c
            def execute(self, query, params=()):
                q = query.replace('%s', '?')
                q = q.replace('gen_random_uuid()', 'lower(hex(randomblob(16)))')
                q = q.replace('CURRENT_TIMESTAMP', "datetime('now')")
                if 'ON CONFLICT' in q and 'DO UPDATE' in q and 'users' in q:
                    # Strip Postgres-specific EXCLUDED syntax for SQLite compatibility
                    q = "INSERT OR REPLACE INTO users (id, email, password_hash, google_id, full_name) VALUES (?, ?, ?, ?, ?)"
                try:
                    return self.c.execute(q, params)
                except sqlite3.OperationalError as oe:
                    if 'no such table' in str(oe).lower():
                        self.c.execute("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, google_id TEXT, full_name TEXT)")
                        self.c.execute("CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, user_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)")
                        self.c.execute("CREATE TABLE IF NOT EXISTS profiles (profile_id TEXT PRIMARY KEY, user_id TEXT UNIQUE, first_name TEXT, last_name TEXT, role TEXT, workplace TEXT, bio TEXT, profile_image_url TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)")
                        return self.c.execute(q, params)
                    raise oe
            def fetchone(self):
                return self.c.fetchone()
            def fetchall(self):
                return self.c.fetchall()
            def close(self):
                self.c.close()
        return SQLiteCursorAdapter(cur)
    def commit(self):
        self.conn.commit()
    def rollback(self):
        self.conn.rollback()
    def close(self):
        self.conn.close()

from psycopg2 import pool
_db_pool = None

def get_db_connection():
    global _tunnel, _db_pool
    db_host = os.getenv("POSTGRES_HOST", "db")
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD") or os.getenv("PSQL_PASSWD") or os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("POSTGRES_DB", "postgres")
    db_port = os.getenv("POSTGRES_PORT", "5432")

    try:
        # Check SSH Tunnel requirement
        if BASTION_IP and SSH_KEY_PATH and RDS_ENDPOINT:
            if _tunnel is None or not _tunnel.is_active:
                print(f"🔒 Starting SSH tunnel via {BASTION_IP}...")
                try:
                    _tunnel = SSHTunnelForwarder(
                        (BASTION_IP, 22),
                        ssh_username=SSH_USER,
                        ssh_pkey=SSH_KEY_PATH,
                        remote_bind_address=(RDS_ENDPOINT, 5432),
                        local_bind_address=('127.0.0.1', LOCAL_BIND_PORT)
                    )
                    _tunnel.start()
                except Exception as e:
                    print(f"❌ Tunnel connection failed: {e}")

            if _db_pool is None:
                _db_pool = psycopg2.pool.SimpleConnectionPool(1, 20,
                    host='127.0.0.1',
                    port=_tunnel.local_bind_port,
                    user=os.getenv("POSTGRES_USER", "lawuser"),
                    password=os.getenv("POSTGRES_PASSWORD", "Siddchick2506"),
                    dbname=os.getenv("POSTGRES_DB", "postgres"),
                    connect_timeout=3,
                    keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5
                )
        else:
            if _db_pool is None:
                # Try primary PostgreSQL connection parameters
                try:
                    _db_pool = psycopg2.pool.SimpleConnectionPool(1, 20,
                        host=db_host,
                        dbname=db_name,
                        user=db_user,
                        password=db_pass,
                        port=db_port,
                        connect_timeout=3,
                        keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5
                    )
                except Exception as primary_err:
                    print(f"⚠️ Primary PostgreSQL connect ({db_host}) failed: {primary_err}. Checking DSN...")
                    dsn = os.getenv("POSTGRES_DSN")
                    if dsn:
                        _db_pool = psycopg2.pool.SimpleConnectionPool(1, 20, dsn,
                            connect_timeout=3,
                            keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5)
                    else:
                        raise primary_err

        conn = _db_pool.getconn()
        
        class PooledConnectionProxy:
            def __init__(self, c, p):
                self.conn = c
                self.pool = p
            def cursor(self, *args, **kwargs):
                return self.conn.cursor(*args, **kwargs)
            def commit(self):
                self.conn.commit()
            def rollback(self):
                self.conn.rollback()
            def close(self):
                self.pool.putconn(self.conn)
                
        return PooledConnectionProxy(conn, _db_pool)

    except Exception as pg_err:
        print(f"⚠️ PostgreSQL connection pool initialization failed: {pg_err}. Using local SQLite fallback database.")
        _db_pool = None
        db_path = os.path.join(os.path.dirname(__file__), "auth_fallback.db")
        return SQLitePooledConnectionProxy(db_path)

# Pydantic Models
class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str

class GoogleLoginModel(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class ProfileUpdate(BaseModel):
    user_id: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    role: Optional[str] = None
    workplace: Optional[str] = None
    bio: Optional[str] = None
    image: Optional[str] = None

def get_profile_internal(cur, user_id):
    try:
        cur.execute("""
            SELECT first_name, last_name, role, workplace, bio, profile_image_url 
            FROM profiles 
            WHERE user_id = %s
        """, (user_id,))
        result = cur.fetchone()
        
        if not result:
            return {}
            
        return {
            "firstName": result[0],
            "lastName": result[1],
            "role": result[2],
            "workplace": result[3],
            "bio": result[4],
            "image": result[5]
        }
    except Exception:
        return {}

# Helper Functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def build_display_name(email: str) -> str:
    local_part = email.split("@", 1)[0].strip()
    return local_part or "New User"


def ensure_auth_schema():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        except Exception:
            pass

        try:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)")
        except Exception:
            pass
        try:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)")
        except Exception:
            pass
        try:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)")
        except Exception:
            pass

        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE,
                    password_hash VARCHAR(255),
                    google_id VARCHAR(255),
                    full_name VARCHAR(255)
                )
            """)
        except Exception:
            pass

        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        except Exception:
            pass

        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS profiles (
                    profile_id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) UNIQUE,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    role VARCHAR(100),
                    workplace VARCHAR(100),
                    bio TEXT,
                    profile_image_url TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        except Exception:
            pass

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Non-fatal schema sync notice: {e}")


@app.on_event("startup")
def startup_schema_sync():
    ensure_auth_schema()

@app.get("/")
def read_root():
    return {"message": "Auth Service is running"}

def resolve_and_provision_session(session_id: str, cur, conn) -> str:
    """
    Validates a session_id. If it's a non-UUID format and DEV_BYPASS_AUTH is true,
    maps it to a deterministic UUID and auto-provisions a mock user/session.
    Returns the user_id (as a string UUID) or raises HTTPException.
    """
    # 1. Parse or generate session UUID
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        if os.getenv("DEV_BYPASS_AUTH") == "true" or os.getenv("DEV_BYPASS_AUTH", "false").lower() == "true":
            import hashlib
            session_uuid = uuid.UUID(hashlib.md5(session_id.encode('utf-8')).hexdigest())
        else:
            raise HTTPException(status_code=401, detail="Invalid session token format.")

    # 2. Check if session exists in DB
    cur.execute("SELECT user_id FROM sessions WHERE session_id = %s", (str(session_uuid),))
    result = cur.fetchone()
    if result:
        return str(result[0])

    # 3. If not found, check if we can auto-provision
    if os.getenv("DEV_BYPASS_AUTH") == "true" or os.getenv("DEV_BYPASS_AUTH", "false").lower() == "true":
        import hashlib
        user_seed = f"user_{session_id}"
        user_uuid = uuid.UUID(hashlib.md5(user_seed.encode('utf-8')).hexdigest())
        
        email = f"{session_id.replace('-session', '')}@example.com"
        if "local-test" in session_id:
            email = "local-test@example.com"
        elif "bob" in session_id:
            email = "bob@example.com"

        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (str(user_uuid),))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO users (id, email, password_hash) VALUES (%s, %s, %s) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id",
                (str(user_uuid), email, "mock_hash")
            )
            res = cur.fetchone()
            if res:
                user_uuid = res[0]

        # Insert session
        cur.execute(
            "INSERT INTO sessions (session_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (str(session_uuid), str(user_uuid))
        )
        conn.commit()
        return str(user_uuid)

    if os.getenv("DEV_BYPASS_AUTH", "true").lower() == "true":
        return "dev_counsel_bypass"

    raise HTTPException(status_code=401, detail="Invalid session")


@app.get("/verify_session/{session_id}")
def verify_session(session_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        user_id = resolve_and_provision_session(session_id, cur, conn)
        cur.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        email = user_row[0] if user_row else f"user_{user_id[:8]}@example.com"
        return {"valid": True, "user_id": user_id, "email": email}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Session verification error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cur.close()
        conn.close()

@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT first_name, last_name, role, workplace, bio, profile_image_url 
            FROM profiles 
            WHERE user_id = %s
        """, (user_id,))
        result = cur.fetchone()
        
        if not result:
            return {}
            
        return {
            "firstName": result[0],
            "lastName": result[1],
            "role": result[2],
            "workplace": result[3],
            "bio": result[4],
            "image": result[5]
        }
    except Exception as e:
        print(f"Get profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")
    finally:
        cur.close()
        conn.close()

@app.post("/profile/update")
def update_profile(profile: ProfileUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Check if profile exists
        cur.execute("SELECT profile_id FROM profiles WHERE user_id = %s", (profile.user_id,))
        exists = cur.fetchone()
        
        if exists:
            cur.execute("""
                UPDATE profiles 
                SET first_name = %s, last_name = %s, role = %s, workplace = %s, bio = %s, profile_image_url = %s, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
            """, (profile.firstName, profile.lastName, profile.role, profile.workplace, profile.bio, profile.image, profile.user_id))
        else:
            cur.execute("""
                INSERT INTO profiles (user_id, first_name, last_name, role, workplace, bio, profile_image_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (profile.user_id, profile.firstName, profile.lastName, profile.role, profile.workplace, profile.bio, profile.image))
            
        conn.commit()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        conn.rollback()
        print(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")
    finally:
        cur.close()
        conn.close()

@app.post("/register")
def register(user: UserSignup):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Check if user already exists (case-insensitive lookup)
        email_lower = user.email.strip().lower() if user.email else ""
        cur.execute("SELECT id FROM users WHERE LOWER(email) = %s", (email_lower,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_pwd = hash_password(user.password)
        display_name = build_display_name(user.email)
        
        cur.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (%s, %s, %s)",
            (user_id, email_lower, hashed_pwd)
        )
        conn.commit()
        return {"message": "User registered successfully", "user_id": user_id}
        
    except HTTPException as he:
        conn.rollback()
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/login")
def login(user: UserLogin):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        email_lower = user.email.strip().lower() if user.email else ""
        cur.execute("SELECT id, password_hash FROM users WHERE LOWER(email) = %s", (email_lower,))
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id, stored_hash = result
        
        if not stored_hash:
            raise HTTPException(
                status_code=400,
                detail="This account was registered using Google Sign-In. Please sign in with Google, or reset your password to set a manual login password."
            )
            
        if not verify_password(user.password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        # Create Session
        session_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO sessions (session_id, user_id) VALUES (%s, %s)",
            (session_id, user_id)
        )
        conn.commit()
        

        return {
            "message": "Login successful", 
            "session_id": session_id, 
            "user_id": user_id,
            "email": email_lower,
            "profile": get_profile_internal(cur, user_id)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cur.close()
        conn.close()

@app.post("/google-login")
def google_login(model: GoogleLoginModel):
    token = model.token
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        email = None
        google_id = None
        id_info = None
        user_info = None
        
        # 1. Try checking if it's a valid ID Token (JWT)
        try:
            CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
            id_info = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
            if id_info:
                email = id_info.get('email')
                google_id = id_info.get('sub')
        except Exception:
            # 2. If not a valid ID Token, assume it's an Access Token and check UserInfo endpoint
            import requests as http_requests
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            resp = http_requests.get(userinfo_url, headers={'Authorization': f'Bearer {token}'})
            
            if resp.status_code == 200:
                user_info = resp.json()
                email = user_info.get('email')
                google_id = user_info.get('sub')
            else:
                raise ValueError("Invalid Google access token")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid token: no email found")
             
        email = email.strip().lower()
        user_name = (id_info or {}).get('name') or (user_info or {}).get('name') or build_display_name(email)
        user_picture = (id_info or {}).get('picture') or (user_info or {}).get('picture')
             
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE LOWER(email) = %s", (email,))
        result = cur.fetchone()
        
        user_id = None
        if result:
            user_id = result[0]
            # Update google_id if missing (optional but good practice)
            cur.execute("UPDATE users SET google_id = %s WHERE id = %s", (google_id, user_id))
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            placeholder_password = hash_password(str(uuid.uuid4()))
            cur.execute(
                "INSERT INTO users (id, email, password_hash, google_id, full_name) VALUES (%s, %s, %s, %s, %s)",
                (user_id, email, placeholder_password, google_id, user_name)
            )
        
        # Ensure Profile exists for Google Login users
        cur.execute("SELECT profile_id FROM profiles WHERE user_id = %s", (user_id,))
        if not cur.fetchone():
            first_name, last_name = "", ""
            if user_name:
                parts = user_name.split(None, 1)
                first_name = parts[0]
                if len(parts) > 1:
                    last_name = parts[1]
            cur.execute(
                "INSERT INTO profiles (user_id, first_name, last_name, profile_image_url) VALUES (%s, %s, %s, %s)",
                (user_id, first_name, last_name, user_picture)
            )

        # Create Session
        session_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO sessions (session_id, user_id) VALUES (%s, %s)",
            (session_id, user_id)
        )
        conn.commit()
        
        return {
            "message": "Google login successful", 
            "session_id": session_id, 
            "user_id": user_id,
            "email": email,
            "name": user_name,
            "picture": user_picture,
            # Fetch full profile from DB for caching
            "profile": get_profile_internal(cur, user_id)
        }
        
    except ValueError as e:
        print(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except HTTPException as he:
        conn.rollback()
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Google login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

class LogoutModel(BaseModel):
    session_id: str

@app.post("/logout")
def logout(model: LogoutModel):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        session_id = model.session_id
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            if os.getenv("DEV_BYPASS_AUTH") == "true" or os.getenv("DEV_BYPASS_AUTH", "false").lower() == "true":
                import hashlib
                session_uuid = uuid.UUID(hashlib.md5(session_id.encode('utf-8')).hexdigest())
            else:
                raise HTTPException(status_code=401, detail="Invalid session token format.")
                
        cur.execute("DELETE FROM sessions WHERE session_id = %s", (session_uuid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Session not found")
            
        conn.commit()
        return {"message": "Logged out successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cur.close()
        conn.close()

@app.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    import random
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. Check if user exists (case-insensitive)
        email_lower = request.email.strip().lower() if request.email else ""
        cur.execute("SELECT id FROM users WHERE LOWER(email) = %s", (email_lower,))
        user = cur.fetchone()
        
        if not user:
            # Security: Always return success to prevent email enumeration
            return {"message": "OTP verification code sent if the email is registered."}
            
        user_id = user[0]
        
        # 2. Generate 6-digit OTP code and save/update it
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=10) # Expires in 10 minutes
        
        cur.execute("""
            INSERT INTO password_reset_otps (email, otp_code, expires_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (email)
            DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at
        """, (email_lower, otp_code, expires_at))
        conn.commit()
        
        # 3. Send Email via Notification Service
        try:
            notification_payload = {
                "to_email": email_lower,
                "subject": "Reset Your DraftMate Password - Verification Code",
                "body": f"Your verification code to reset your password is: {otp_code}\n\nThis code will expire in 10 minutes."
            }
            requests.post("http://localhost:8015/send-email", json=notification_payload, timeout=5)
        except Exception as e:
            print(f"Failed to call Notification Service: {e}")
            
        response = {"message": "OTP verification code sent if the email is registered."}
        env = os.getenv("ENVIRONMENT", "development").strip().lower()
        if "development" in env or env.startswith("dev"):
            response["dev_otp"] = otp_code
            
        return response
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cur.close()
        conn.close()

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

@app.post("/verify-otp")
def verify_otp(request: VerifyOTPRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        email_lower = request.email.strip().lower() if request.email else ""
        
        # 1. Fetch OTP record
        cur.execute("SELECT otp_code, expires_at FROM password_reset_otps WHERE email = %s", (email_lower,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=400, detail="Invalid code or code expired.")
            
        stored_otp, expires_at = row
        
        # Ensure timezone compatibility
        now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.utcnow()
        
        if now > expires_at:
            # Delete expired OTP
            cur.execute("DELETE FROM password_reset_otps WHERE email = %s", (email_lower,))
            conn.commit()
            raise HTTPException(status_code=400, detail="Invalid code or code expired.")
            
        if request.otp.strip() != stored_otp:
            raise HTTPException(status_code=400, detail="Invalid code or code expired.")
            
        # 2. Get User ID
        cur.execute("SELECT id FROM users WHERE LOWER(email) = %s", (email_lower,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="User not found.")
            
        user_id = user[0]
        
        # 3. Generate reset JWT token (1 hour)
        expiration = datetime.utcnow() + timedelta(hours=1)
        payload = {
            "sub": user_id,
            "type": "reset_password",
            "exp": expiration
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        # 4. Clean up OTP record
        cur.execute("DELETE FROM password_reset_otps WHERE email = %s", (email_lower,))
        conn.commit()
        
        return {"message": "OTP verified successfully.", "token": token}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Verify OTP error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cur.close()
        conn.close()

@app.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. Verify Token
        try:
            payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            token_type = payload.get("type")
            
            if not user_id or token_type != "reset_password":
                raise HTTPException(status_code=400, detail="Invalid token content")
                
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="Token has expired. Please request a new one.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=400, detail="Invalid token")

        # 2. Update Password
        hashed_pwd = hash_password(request.new_password)
        
        cur.execute("UPDATE users SET password = %s, password_hash = %s WHERE id = %s", (hashed_pwd, hashed_pwd, user_id))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        conn.commit()
        
        # Optional: Revoke existing sessions?
        # cur.execute("DELETE FROM sessions WHERE user_id = %s", (user_id,))
        # conn.commit()
        
        return {"message": "Password updated successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cur.close()
        conn.close()


from typing import List, Dict, Any

class DraftRegister(BaseModel):
    draft_id: str
    name: str
    filename: str
    document_key: str
    created_by: str
    variables_detected: Optional[List[Any]] = []
    status: Optional[str] = "In progress"

class DraftShare(BaseModel):
    draft_id: str
    email: str
    access_level: Optional[str] = "edit"

class FolderCreate(BaseModel):
    id: str
    name: str

class FolderRename(BaseModel):
    id: str
    name: str

class FolderDelete(BaseModel):
    id: str

class DraftDelete(BaseModel):
    id: str

class DraftUpdate(BaseModel):
    id: str
    folder_id: Optional[str] = None
    status: Optional[str] = None
    name: Optional[str] = None

def get_user_id_from_header(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    session_id = authorization.split(" ", 1)[1].strip()
    if not session_id:
        raise HTTPException(status_code=401, detail="Missing session token.")
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        return resolve_and_provision_session(session_id, cur, conn)
    finally:
        cur.close()
        conn.close()

@app.post("/internal/draft/register")
def register_draft(draft: DraftRegister):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        import json
        variables_json = json.dumps(draft.variables_detected or [])
        # Insert draft
        cur.execute("""
            INSERT INTO drafts (id, name, filename, document_key, created_by, variables_detected, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                filename = EXCLUDED.filename,
                variables_detected = EXCLUDED.variables_detected,
                updated_at = CURRENT_TIMESTAMP
        """, (draft.draft_id, draft.name, draft.filename, draft.document_key, draft.created_by, variables_json, draft.status))
        
        # Ensure creator has access
        cur.execute("""
            INSERT INTO draft_access (draft_id, user_id, access_level)
            VALUES (%s, %s, 'edit')
            ON CONFLICT (draft_id, user_id) DO NOTHING
        """, (draft.draft_id, draft.created_by))
        
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Register draft error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/internal/draft/touch/{draft_id}")
def touch_draft(draft_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        import uuid
        import hashlib
        new_key = hashlib.sha256(str(uuid.uuid4()).encode('utf-8')).hexdigest()
        cur.execute("UPDATE drafts SET updated_at = CURRENT_TIMESTAMP, document_key = %s WHERE id = %s", (new_key, draft_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Touch draft error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/internal/draft/verify_access/{draft_id}")
def verify_draft_access(draft_id: str, user_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Check if user is owner
        cur.execute("SELECT created_by FROM drafts WHERE id::text = %s OR document_key = %s", (draft_id, draft_id))
        res = cur.fetchone()
        if res:
            if str(res[0]) == str(user_id):
                return {"access_level": "edit"}
            
        # Check ACL permissions for shared drafts
        cur.execute("SELECT access_level FROM draft_access WHERE draft_id::text = %s AND user_id = %s", (draft_id, user_id))
        res_acl = cur.fetchone()
        if res_acl:
            return {"access_level": res_acl[0]}
            
        # Strictly reject unauthorized users trying to access another user's draft ID
        raise HTTPException(status_code=403, detail="Access Denied: You do not have permission to view or edit this draft.")
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Verify draft access error: {e}")
        raise HTTPException(status_code=403, detail="Access Denied: Ownership verification failed.")
    finally:
        cur.close()
        conn.close()

@app.get("/internal/draft/get/{draft_id}")
def get_draft_internal(draft_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, filename, document_key, created_by, folder_id, variables_detected, status FROM drafts WHERE id::text = %s OR document_key = %s", (draft_id, draft_id))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Draft not found")
        import json
        return {
            "id": str(r[0]),
            "name": r[1],
            "filename": r[2],
            "documentKey": r[3],
            "createdBy": str(r[4]),
            "folderId": r[5],
            "variablesDetected": r[6] if r[6] is not None else [],
            "status": r[7]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Get draft internal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/v2/draft/list")
def list_drafts(user_id: str = Depends(get_user_id_from_header)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Get drafts the user has access to
        cur.execute("""
            SELECT DISTINCT d.id, d.name, d.filename, d.document_key, d.created_by, d.folder_id, d.variables_detected, d.status, d.created_at, d.updated_at
            FROM drafts d
            LEFT JOIN draft_access da ON d.id = da.draft_id
            WHERE d.created_by = %s OR da.user_id = %s
            ORDER BY d.updated_at DESC
        """, (user_id, user_id))
        
        drafts_res = cur.fetchall()
        drafts_list = []
        for r in drafts_res:
            drafts_list.append({
                "id": str(r[0]),
                "name": r[1],
                "filename": r[2],
                "documentKey": r[3],
                "createdBy": str(r[4]),
                "folderId": r[5],
                "variablesDetected": r[6] if r[6] is not None else [],
                "status": r[7],
                "createdAt": r[8].isoformat() if r[8] else None,
                "lastModified": r[9].isoformat() if r[9] else None,
            })
            
        # Get folders
        cur.execute("SELECT id, name, user_id, created_at FROM folders WHERE user_id = %s ORDER BY created_at ASC", (user_id,))
        folders_res = cur.fetchall()
        folders_list = []
        for r in folders_res:
            folders_list.append({
                "id": r[0],
                "name": r[1],
                "userId": str(r[2]),
                "createdAt": r[3].isoformat() if r[3] else None
            })
            
        return {"drafts": drafts_list, "folders": folders_list}
    except Exception as e:
        print(f"List drafts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve drafts")
    finally:
        cur.close()
        conn.close()

@app.post("/v2/draft/share")
def share_draft(share: DraftShare, user_id: str = Depends(get_user_id_from_header)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Check permissions
        cur.execute("SELECT created_by FROM drafts WHERE id = %s", (share.draft_id,))
        owner_res = cur.fetchone()
        if not owner_res:
            raise HTTPException(status_code=404, detail="Draft not found")
            
        is_owner = str(owner_res[0]) == user_id
        
        if not is_owner:
            # Check ACL edit permission
            cur.execute("SELECT access_level FROM draft_access WHERE draft_id = %s AND user_id = %s", (share.draft_id, user_id))
            acl_res = cur.fetchone()
            if not acl_res or acl_res[0] != 'edit':
                raise HTTPException(status_code=403, detail="You do not have permission to share this draft")
                
        # Find target user by email
        cur.execute("SELECT id FROM users WHERE email = %s", (share.email.strip().lower(),))
        target_res = cur.fetchone()
        if not target_res:
            raise HTTPException(status_code=404, detail="User with this email not found")
            
        target_user_id = target_res[0]
        
        # Add access record
        cur.execute("""
            INSERT INTO draft_access (draft_id, user_id, access_level)
            VALUES (%s, %s, %s)
            ON CONFLICT (draft_id, user_id) DO UPDATE SET access_level = EXCLUDED.access_level
        """, (share.draft_id, target_user_id, share.access_level))
        
        conn.commit()
        return {"ok": True, "message": f"Draft shared successfully with {share.email}"}
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Share draft error: {e}")
        raise HTTPException(status_code=500, detail="Failed to share draft")
    finally:
        cur.close()
        conn.close()

@app.post("/v2/draft/folder/create")
def create_folder(folder: FolderCreate, user_id: str = Depends(get_user_id_from_header)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO folders (id, name, user_id) VALUES (%s, %s, %s)", (folder.id, folder.name, user_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Create folder error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create folder")
    finally:
        cur.close()
        conn.close()

@app.post("/v2/draft/folder/rename")
def rename_folder(folder: FolderRename, user_id: str = Depends(get_user_id_from_header)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE folders SET name = %s WHERE id = %s AND user_id = %s", (folder.name, folder.id, user_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Rename folder error: {e}")
        raise HTTPException(status_code=500, detail="Failed to rename folder")
    finally:
        cur.close()
        conn.close()

@app.post("/v2/draft/folder/delete")
def delete_folder(folder: FolderDelete, user_id: str = Depends(get_user_id_from_header)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM folders WHERE id = %s AND user_id = %s", (folder.id, user_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Delete folder error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete folder")
    finally:
        cur.close()
        conn.close()

@app.post("/v2/draft/delete")
def delete_draft(draft: DraftDelete, user_id: str = Depends(get_user_id_from_header)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Check permissions: only creator can delete
        cur.execute("SELECT created_by FROM drafts WHERE id = %s", (draft.id,))
        owner_res = cur.fetchone()
        if not owner_res:
            raise HTTPException(status_code=404, detail="Draft not found")
            
        if str(owner_res[0]) != user_id:
            raise HTTPException(status_code=403, detail="Only the owner can delete this draft")
            
        cur.execute("DELETE FROM drafts WHERE id = %s", (draft.id,))
        conn.commit()

        # Remove document directory and files from EFS storage (/app/shared_drafts/{draft_id})
        try:
            import shutil
            shared_storage_path = os.getenv("SHARED_STORAGE_PATH", "/app/shared_drafts")
            draft_efs_dir = os.path.join(shared_storage_path, str(draft.id))
            if os.path.exists(draft_efs_dir):
                shutil.rmtree(draft_efs_dir, ignore_errors=True)
                print(f"🗑️ EFS Storage: Deleted folder {draft_efs_dir}")
        except Exception as efs_err:
            print(f"EFS directory cleanup notice for {draft.id}: {efs_err}")

        return {"ok": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Delete draft error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete draft")
    finally:
        cur.close()
        conn.close()

@app.post("/v2/draft/update")
def update_draft(draft: DraftUpdate, user_id: str = Depends(get_user_id_from_header)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Verify access to edit this draft
        cur.execute("SELECT created_by FROM drafts WHERE id = %s", (draft.id,))
        owner_res = cur.fetchone()
        if not owner_res:
            raise HTTPException(status_code=404, detail="Draft not found")
            
        is_owner = str(owner_res[0]) == user_id
        if not is_owner:
            cur.execute("SELECT access_level FROM draft_access WHERE draft_id = %s AND user_id = %s", (draft.id, user_id))
            acl_res = cur.fetchone()
            if not acl_res or acl_res[0] != 'edit':
                raise HTTPException(status_code=403, detail="You do not have permission to modify this draft")
                
        # Build update query
        updates = []
        params = []
        
        # Handle folder_id
        if draft.folder_id is not None:
            if draft.folder_id == "" or draft.folder_id.lower() == "null" or draft.folder_id == "none":
                updates.append("folder_id = NULL")
            else:
                updates.append("folder_id = %s")
                params.append(draft.folder_id)
                
        if draft.status is not None:
            updates.append("status = %s")
            params.append(draft.status)
            
        if draft.name is not None:
            updates.append("name = %s")
            params.append(draft.name)
            
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            query = f"UPDATE drafts SET {', '.join(updates)} WHERE id = %s"
            params.append(draft.id)
            cur.execute(query, tuple(params))
            conn.commit()
            
        return {"ok": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Update draft error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update draft")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    print("Registered Routes:")
    for route in app.routes:
        print(f"Path: {route.path} | Name: {route.name} | Methods: {route.methods}")
    uvicorn.run(app, host="0.0.0.0", port=8009)
