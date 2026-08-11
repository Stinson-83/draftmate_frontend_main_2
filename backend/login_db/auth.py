import os
import uuid
import psycopg2
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
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

from psycopg2 import pool
_db_pool = None

def get_db_connection():
    global _tunnel, _db_pool
    try:
        # Check if we need to use SSH tunnel
        if BASTION_IP and SSH_KEY_PATH and RDS_ENDPOINT:
            # Only start tunnel if not already active
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
                    print(f"✅ Tunnel active on port {_tunnel.local_bind_port}")
                except Exception as e:
                    print(f"❌ Tunnel connection failed: {e}")
                    raise

            if _db_pool is None:
                _db_pool = psycopg2.pool.SimpleConnectionPool(1, 20,
                    host='127.0.0.1',
                    port=_tunnel.local_bind_port,
                    user=os.getenv("POSTGRES_USER", "lawuser"),
                    password=os.getenv("POSTGRES_PASSWORD", "Siddchick2506"),
                    dbname=os.getenv("POSTGRES_DB", "postgres"),
                    keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5
                )
        else:
            if _db_pool is None:
                # Direct connection
                dsn = os.getenv("POSTGRES_DSN")
                if dsn:
                    _db_pool = psycopg2.pool.SimpleConnectionPool(1, 20, dsn,
                        keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5)
                else:
                    _db_pool = psycopg2.pool.SimpleConnectionPool(1, 20,
                        host=os.getenv("POSTGRES_HOST", "db"),
                        dbname=os.getenv("POSTGRES_DB", "lex_bot_db"),
                        user=os.getenv("POSTGRES_USER", "postgres"),
                        password=os.getenv("POSTGRES_PASSWORD", "password"),
                        port=os.getenv("POSTGRES_PORT", "5432"),
                        keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5
                    )
                    
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

    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

def resolve_uuid_from_identifier(identifier: str, cur) -> Optional[str]:
    import uuid
    import hashlib
    try:
        uuid.UUID(identifier)
        return identifier
    except ValueError:
        pass

    cur.execute("SELECT id FROM drafts WHERE document_key = %s", (identifier,))
    res = cur.fetchone()
    if res:
        return str(res[0])

    cur.execute("SELECT id FROM drafts;")
    all_drafts = cur.fetchall()
    for d in all_drafts:
        d_id_str = str(d[0])
        d_hash = hashlib.sha256(d_id_str.encode('utf-8')).hexdigest()
        if d_hash == identifier:
            return d_id_str
            
    return None

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

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ProfileUpdate(BaseModel):
    user_id: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    role: Optional[str] = None
    workplace: Optional[str] = None
    bio: Optional[str] = None
    image: Optional[str] = None

class ChronologyCaseCreate(BaseModel):
    name: str
    user_id: str

class ChronologyDocumentRegister(BaseModel):
    case_id: str
    file_name: str
    file_size: int

class ChronologyDocumentUpdate(BaseModel):
    doc_id: str
    status: str
    pages_processed: int
    total_pages: int

class ChronologyEventRegister(BaseModel):
    case_id: str
    event_date: str
    date_type: str
    event_description: str
    actors: List[str]
    source_document: str
    source_page: int
    source_text: str
    confidence: float
    is_conflict: bool
    conflict_details: List[dict]
    status: Optional[str] = "pending"

class ChronologyEventUpdate(BaseModel):
    event_id: str
    event_date: Optional[str] = None
    date_type: Optional[str] = None
    event_description: Optional[str] = None
    actors: Optional[List[str]] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_text: Optional[str] = None
    confidence: Optional[float] = None
    is_conflict: Optional[bool] = None
    conflict_details: Optional[List[dict]] = None
    status: Optional[str] = None
    user_modified: Optional[bool] = True

class RedlineChangeRegister(BaseModel):
    draft_id: str
    paragraph_id: str
    original_text: str
    new_text: str
    summary: str

class RedlineChangeStatusUpdate(BaseModel):
    change_id: str
    status: str

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
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

        cur.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
        """)
        cur.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

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
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS chronology_cases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'uploading',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS chronology_documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                case_id UUID REFERENCES chronology_cases(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_size INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                pages_processed INTEGER DEFAULT 0,
                total_pages INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS chronology_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                case_id UUID REFERENCES chronology_cases(id) ON DELETE CASCADE,
                event_date VARCHAR(50),
                date_type VARCHAR(50) DEFAULT 'exact',
                event_description TEXT NOT NULL,
                actors JSONB DEFAULT '[]'::jsonb,
                source_document VARCHAR(255),
                source_page INTEGER DEFAULT 1,
                source_text TEXT,
                confidence REAL DEFAULT 1.0,
                is_conflict BOOLEAN DEFAULT FALSE,
                conflict_details JSONB DEFAULT '[]'::jsonb,
                status VARCHAR(50) DEFAULT 'pending',
                user_modified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS redline_changes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
                paragraph_id VARCHAR(100) NOT NULL,
                original_text TEXT,
                new_text TEXT,
                summary TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Schema sync error: {e}")
        raise
    finally:
        cur.close()
        conn.close()


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

    raise HTTPException(status_code=401, detail="Invalid session")


@app.get("/verify_session/{session_id}")
def verify_session(session_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        user_id = resolve_and_provision_session(session_id, cur, conn)
        return {"valid": True, "user_id": user_id}
        
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
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_pwd = hash_password(user.password)
        display_name = build_display_name(user.email)
        
        cur.execute(
            "INSERT INTO users (id, name, email, password, password_hash) VALUES (%s, %s, %s, %s, %s)",
            (user_id, display_name, user.email, hashed_pwd, hashed_pwd)
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
        cur.execute("SELECT id, COALESCE(password_hash, password) FROM users WHERE email = %s", (user.email,))
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id, stored_hash = result
        
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
            "email": user.email,
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
        
        # 1. Try checking if it's a valid ID Token (JWT)
        try:
            CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
            id_info = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
            email = id_info.get('email')
            google_id = id_info.get('sub')
        except ValueError:
            # 2. If not a valid ID Token, assume it's an Access Token and check UserInfo endpoint
            import requests as http_requests
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            resp = http_requests.get(userinfo_url, headers={'Authorization': f'Bearer {token}'})
            
            if resp.status_code == 200:
                user_info = resp.json()
                email = user_info.get('email')
                google_id = user_info.get('sub')
            else:
                 raise ValueError("Invalid access token")

        if not email:
             raise HTTPException(status_code=400, detail="Invalid token: no email found")
             
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        result = cur.fetchone()
        
        user_id = None
        if result:
            user_id = result[0]
            # Update google_id if missing (optional but good practice)
            cur.execute("UPDATE users SET google_id = %s WHERE id = %s", (google_id, user_id))
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            display_name = user_info.get('name') if 'user_info' in locals() else id_info.get('name') if 'id_info' in locals() else build_display_name(email)
            placeholder_password = hash_password(str(uuid.uuid4()))
            cur.execute(
                "INSERT INTO users (id, name, email, password, password_hash, google_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (user_id, display_name, email, placeholder_password, placeholder_password, google_id)
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
            "name": id_info.get('name') if 'id_info' in locals() else user_info.get('name'),
            "picture": id_info.get('picture') if 'id_info' in locals() else user_info.get('picture'),
            # Fetch full profile from DB for caching
            "profile": get_profile_internal(cur, user_id)
        }
        
    except ValueError as e:
         print(f"Token verification failed: {e}")
         raise HTTPException(status_code=401, detail="Invalid Google token")
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
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", (request.email,))
        user = cur.fetchone()
        
        if not user:
            # Security: Always return success to prevent email enumeration
            return {"message": "If this email is registered, a password reset link has been sent."}
            
        user_id = user[0]
        
        # 2. Generate JWT Token (Stateless)
        expiration = datetime.utcnow() + timedelta(hours=1)
        payload = {
            "sub": user_id,
            "type": "reset_password",
            "exp": expiration
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

        # 3. Create Reset Link
        
        # Safety: Default to 'development' if env var is missing to prevent crash on .strip()
        env_mode = os.getenv("ENVIRONMENT", "development").strip().lower()
        
        if env_mode == "production":
             frontend_url = os.getenv("FRONTEND_URL_PROD").strip()
        elif env_mode == "development":
             frontend_url = os.getenv("FRONTEND_URL_DEV").strip()
             
        reset_link = f"{frontend_url}/reset-password?token={token}"
        
        # 4. Send Email via Notification Service
        try:
            notification_payload = {
                "to_email": request.email,
                "subject": "Reset Your DraftMate Password",
                "body": f"Click the link below to reset your password. This link expires in 1 hour.\n\n{reset_link}"
            }
            # Add timeout to prevent hanging
            # Use localhost since notification service runs in the same container (via supervisord)
            requests.post("http://localhost:8015/send-email", json=notification_payload, timeout=5)
        except Exception as e:
            print(f"Failed to call Notification Service: {e}")
            # We still return success to the user, but maybe log this error
            
        # Return link for dev/testing convenience (Remove in production!)
        response= {"message": "Reset link sent"}
        if os.getenv("ENVIRONMENT") == "development":
            response["dev_link"] = reset_link

        return response
        
    except Exception as e:
        print(f"Forgot password error: {e}")
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
        resolved_id = resolve_uuid_from_identifier(draft_id, cur)
        if resolved_id:
            draft_id = resolved_id

        # Check if user is owner
        cur.execute("SELECT created_by FROM drafts WHERE id = %s", (draft_id,))
        res = cur.fetchone()
        if res and str(res[0]) == user_id:
            return {"access_level": "edit"}
            
        # Check ACL
        cur.execute("SELECT access_level FROM draft_access WHERE draft_id = %s AND user_id = %s", (draft_id, user_id))
        res = cur.fetchone()
        if res:
            return {"access_level": res[0]}
            
        return {"access_level": "none"}
    except Exception as e:
        print(f"Verify draft access error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/internal/draft/get/{draft_id}")
def get_draft_internal(draft_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        resolved_id = resolve_uuid_from_identifier(draft_id, cur)
        if resolved_id:
            draft_id = resolved_id

        cur.execute("SELECT id, name, filename, document_key, created_by, folder_id, variables_detected, status FROM drafts WHERE id = %s", (draft_id,))
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


@app.post("/internal/chronology/case")
def internal_create_case(case: ChronologyCaseCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO chronology_cases (name, user_id) VALUES (%s, %s) RETURNING id",
            (case.name, case.user_id)
        )
        case_id = cur.fetchone()[0]
        conn.commit()
        return {"id": str(case_id)}
    except Exception as e:
        conn.rollback()
        print(f"Internal create case error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/internal/chronology/case/{case_id}")
def internal_get_case(case_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, status, created_at, user_id FROM chronology_cases WHERE id = %s", (case_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Case not found")
        return {
            "id": str(r[0]),
            "name": r[1],
            "status": r[2],
            "created_at": r[3].isoformat() if r[3] else None,
            "user_id": str(r[4])
        }
    except Exception as e:
        print(f"Internal get case error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/internal/chronology/case/status")
def internal_update_case_status(case_id: str, status: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE chronology_cases SET status = %s WHERE id = %s", (status, case_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Internal update case status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/internal/chronology/cases/{user_id}")
def internal_list_cases(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, status, created_at FROM chronology_cases WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        res = cur.fetchall()
        cases = []
        for r in res:
            cases.append({
                "id": str(r[0]),
                "name": r[1],
                "status": r[2],
                "created_at": r[3].isoformat() if r[3] else None
            })
        return {"cases": cases}
    except Exception as e:
        print(f"Internal list cases error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/internal/chronology/document/register")
def internal_register_document(doc: ChronologyDocumentRegister):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO chronology_documents (case_id, file_name, file_size) VALUES (%s, %s, %s) RETURNING id",
            (doc.case_id, doc.file_name, doc.file_size)
        )
        doc_id = cur.fetchone()[0]
        conn.commit()
        return {"id": str(doc_id)}
    except Exception as e:
        conn.rollback()
        print(f"Internal register doc error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/internal/chronology/document/update")
def internal_update_document(doc: ChronologyDocumentUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE chronology_documents SET status = %s, pages_processed = %s, total_pages = %s WHERE id = %s",
            (doc.status, doc.pages_processed, doc.total_pages, doc.doc_id)
        )
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Internal update doc error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/internal/chronology/documents/{case_id}")
def internal_list_documents(case_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, file_name, file_size, status, pages_processed, total_pages, created_at FROM chronology_documents WHERE case_id = %s ORDER BY created_at ASC",
            (case_id,)
        )
        res = cur.fetchall()
        docs = []
        for r in res:
            docs.append({
                "id": str(r[0]),
                "file_name": r[1],
                "file_size": r[2],
                "status": r[3],
                "pages_processed": r[4],
                "total_pages": r[5],
                "created_at": r[6].isoformat() if r[6] else None
            })
        return {"documents": docs}
    except Exception as e:
        print(f"Internal list docs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/internal/chronology/events/register")
def internal_register_events(events: List[ChronologyEventRegister]):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        import json
        for event in events:
            actors_json = json.dumps(event.actors)
            conflict_json = json.dumps(event.conflict_details)
            cur.execute("""
                INSERT INTO chronology_events (case_id, event_date, date_type, event_description, actors, source_document, source_page, source_text, confidence, is_conflict, conflict_details, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (event.case_id, event.event_date, event.date_type, event.event_description, actors_json, event.source_document, event.source_page, event.source_text, event.confidence, event.is_conflict, conflict_json, event.status))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Internal register events error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/internal/chronology/events/{case_id}")
def internal_list_events(case_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Regex sorting fallback for SQLite vs Postgres
        cur.execute("""
            SELECT id, event_date, date_type, event_description, actors, source_document, source_page, source_text, confidence, is_conflict, conflict_details, status, user_modified 
            FROM chronology_events 
            WHERE case_id = %s 
            ORDER BY 
              CASE WHEN event_date LIKE '____-__-__' THEN event_date ELSE '9999-99-99' END ASC, 
              created_at ASC
        """, (case_id,))
        res = cur.fetchall()
        events = []
        for r in res:
            events.append({
                "id": str(r[0]),
                "event_date": r[1],
                "date_type": r[2],
                "event_description": r[3],
                "actors": r[4] if r[4] is not None else [],
                "source_document": r[5],
                "source_page": r[6],
                "source_text": r[7],
                "confidence": r[8],
                "is_conflict": r[9],
                "conflict_details": r[10] if r[10] is not None else [],
                "status": r[11],
                "user_modified": r[12]
            })
        return {"events": events}
    except Exception as e:
        print(f"Internal list events error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/internal/chronology/event/update")
def internal_update_event(event: ChronologyEventUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        import json
        updates = []
        params = []
        
        if event.event_date is not None:
            updates.append("event_date = %s")
            params.append(event.event_date)
        if event.date_type is not None:
            updates.append("date_type = %s")
            params.append(event.date_type)
        if event.event_description is not None:
            updates.append("event_description = %s")
            params.append(event.event_description)
        if event.actors is not None:
            updates.append("actors = %s")
            params.append(json.dumps(event.actors))
        if event.source_document is not None:
            updates.append("source_document = %s")
            params.append(event.source_document)
        if event.source_page is not None:
            updates.append("source_page = %s")
            params.append(event.source_page)
        if event.source_text is not None:
            updates.append("source_text = %s")
            params.append(event.source_text)
        if event.confidence is not None:
            updates.append("confidence = %s")
            params.append(event.confidence)
        if event.is_conflict is not None:
            updates.append("is_conflict = %s")
            params.append(event.is_conflict)
        if event.conflict_details is not None:
            updates.append("conflict_details = %s")
            params.append(json.dumps(event.conflict_details))
        if event.status is not None:
            updates.append("status = %s")
            params.append(event.status)
            
        updates.append("user_modified = %s")
        params.append(event.user_modified)
        
        if updates:
            query = f"UPDATE chronology_events SET {', '.join(updates)} WHERE id = %s"
            params.append(event.event_id)
            cur.execute(query, tuple(params))
            conn.commit()
            
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Internal update event error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.get("/internal/draft/resolve_id/{identifier}")
def internal_resolve_draft_id(identifier: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        resolved_id = resolve_uuid_from_identifier(identifier, cur)
        if resolved_id:
            return {"id": resolved_id}
        raise HTTPException(status_code=404, detail="Draft not found by key")
    except Exception as e:
        print(f"Resolve draft ID error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.post("/internal/redline/change/register")
def internal_register_redline_change(change: RedlineChangeRegister):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO redline_changes (draft_id, paragraph_id, original_text, new_text, summary)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (change.draft_id, change.paragraph_id, change.original_text, change.new_text, change.summary))
        change_id = cur.fetchone()[0]
        conn.commit()
        return {"id": str(change_id)}
    except Exception as e:
        conn.rollback()
        print(f"Internal register redline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/internal/redline/change/status")
def internal_update_redline_status(update: RedlineChangeStatusUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE redline_changes SET status = %s WHERE id = %s", (update.status, update.change_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        print(f"Internal update redline status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/internal/redline/changes/{draft_id}")
def internal_list_redline_changes(draft_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, draft_id, paragraph_id, original_text, new_text, summary, status, created_at 
            FROM redline_changes 
            WHERE draft_id = %s 
            ORDER BY created_at ASC
        """, (draft_id,))
        res = cur.fetchall()
        changes = []
        for r in res:
            changes.append({
                "id": str(r[0]),
                "draft_id": str(r[1]),
                "paragraph_id": r[2],
                "original_text": r[3],
                "new_text": r[4],
                "summary": r[5],
                "status": r[6],
                "created_at": r[7].isoformat() if r[7] else None
            })
        return {"changes": changes}
    except Exception as e:
        print(f"Internal list redlines error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    import uvicorn
    print("Registered Routes:")
    for route in app.routes:
        print(f"Path: {route.path} | Name: {route.name} | Methods: {route.methods}")
    uvicorn.run(app, host="0.0.0.0", port=8009)
