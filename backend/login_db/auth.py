import os
import uuid
import psycopg2
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import bcrypt
from datetime import datetime
from google.oauth2 import id_token
from google.auth.transport import requests

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
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("AUTH_DB_HOST", "user-login-1.cpqe0w8omttt.eu-north-1.rds.amazonaws.com"),
            dbname=os.getenv("AUTH_DB_NAME", "postgres"),
            user=os.getenv("AUTH_DB_USER", "postgres"),
            password=os.getenv("AUTH_DB_PASSWORD", "ItnCEoJrFOVDAvHDwt1u"),
            port=os.getenv("AUTH_DB_PORT", "5432")
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

# Helper Functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@app.get("/")
def read_root():
    return {"message": "Auth Service is running"}

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
        
        return {"message": "Login successful", "session_id": session_id, "user_id": user_id}
        
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
            id_info = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
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
        
        return {"message": "Google login successful", "session_id": session_id, "user_id": user_id}
        
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

if __name__ == "__main__":
    import uvicorn
    print("Registered Routes:")
    for route in app.routes:
        print(f"Path: {route.path} | Name: {route.name} | Methods: {route.methods}")
    uvicorn.run(app, host="0.0.0.0", port=8009)
