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

def get_db_connection():
    global _tunnel
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

            # Connect to local forwarded port
            conn = psycopg2.connect(
                host='127.0.0.1',
                port=_tunnel.local_bind_port,
                user=os.getenv("POSTGRES_USER", "lawuser"),
                password=os.getenv("POSTGRES_PASSWORD", "Siddchick2506"),
                dbname=os.getenv("POSTGRES_DB", "postgres")
            )
            return conn
        else:
            # Direct connection
            dsn = os.getenv("POSTGRES_DSN")
            if dsn:
                conn = psycopg2.connect(dsn)
            else:
                conn = psycopg2.connect(
                    host=os.getenv("POSTGRES_HOST", "db"),
                    dbname=os.getenv("POSTGRES_DB", "lex_bot_db"),
                    user=os.getenv("POSTGRES_USER", "postgres"),
                    password=os.getenv("POSTGRES_PASSWORD", "password"),
                    port=os.getenv("POSTGRES_PORT", "5432")
                )
            return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

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

def get_profile_internal(cur, user_id):
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

# Helper Functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@app.get("/")
def read_root():
    return {"message": "Auth Service is running"}

@app.get("/verify_session/{session_id}")
def verify_session(session_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT user_id FROM sessions WHERE session_id = %s", (session_id,))
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        return {"valid": True, "user_id": result[0]}
        
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
        
        cur.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (%s, %s, %s)",
            (user_id, user.email, hashed_pwd)
        )
        conn.commit()
        return {"message": "User registered successfully", "user_id": user_id}
        
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
        cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (user.email,))
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
            cur.execute(
                "INSERT INTO users (id, email, google_id) VALUES (%s, %s, %s)",
                (user_id, email, google_id)
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
        cur.execute("DELETE FROM sessions WHERE session_id = %s", (model.session_id,))
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
            requests.post("http://notification_service:8015/send-email", json=notification_payload, timeout=5)
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
        
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed_pwd, user_id))
        
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

if __name__ == "__main__":
    import uvicorn
    print("Registered Routes:")
    for route in app.routes:
        print(f"Path: {route.path} | Name: {route.name} | Methods: {route.methods}")
    uvicorn.run(app, host="0.0.0.0", port=8009)
