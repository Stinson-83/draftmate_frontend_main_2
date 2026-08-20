# Plug-and-Play Login System Setup Guide

This directory contains a complete Authentication microservice (`auth.py`) that handles:
- Email/Password Signup & Login
- Google OAuth (Login & Signup)
- Session Management (Postgres backed)
- Logout
- API Security (Bearer Token verification)

Follow these steps to integrate this system into another website.

## 1. Prerequisites
- **Python 3.9+** used 3.12 here
- **PostgreSQL Database** (Cloud or Local) used aws
- **Google Cloud Console Project** (for OAuth)

## 2. Directory Structure
Copy the entire `login_db` folder to your new project's backend.
```text
/backend
  /login_db
    auth.py           # The FastAPI Auth Service
    requirements.txt  # Dependencies
    test.py           # Database testing script (optional)
```

## 3. Installation
Navigate to the directory and install dependencies:
```bash
cd backend/login_db
pip install -r requirements.txt
```

## 4. Environment Variables
Create a `.env` file in your **project root** (or where `auth.py` looks for it).
You need the following variables:

### Database Config
```ini
DB_HOST=your-db-host.com
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
```

### Google OAuth config
Get these from Google Cloud Console > APIs & Services > Credentials.
- **Frontend ID**: For your React/Vue app.
- **Backend ID**: Can be the same as Frontend ID for web apps.
```ini
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
# Required if using Vite frontend
VITE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## 5. Database Setup
You need to create the required tables in your Postgres database.
Run the following SQL commands (you can use `pgAdmin` or `psql`):

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Run the Service
Start the Auth server. You may want to change the port (`8009`) in `auth.py` if needed.
```bash
# Debug/Dev mode
uvicorn auth:app --reload --port 8009

# Production
uvicorn auth:app --host 0.0.0.0 --port 8009
```

## 7. Frontend Integration (React Example)

### A. Dependencies
Install Google OAuth package:
```bash
npm install @react-oauth/google
```

### B. Login/Signup Logic
In your `Login.tsx` or `Signup.tsx`, call the following endpoints:
- **Email Login**: `POST http://localhost:8009/login` (`{email, password}`)
- **Email Signup**: `POST http://localhost:8009/register` (`{email, password}`)
- **Google Login**: `POST http://localhost:8009/google-login` (`{token: credentialResponse.credential}`)

**Saving the Session:**
On success, the backend returns `{ session_id, user_id }`. Save these!
```javascript
localStorage.setItem("session_id", data.session_id);
localStorage.setItem("user_id", data.user_id);
```

**Logout:**
Call `POST http://localhost:8009/logout` with `{ session_id }`, then clear localStorage.

### C. Securing Other APIs
To protect other backend services (like `Query.py`), add a check for the `Authorization` header.

**Frontend Request:**
```javascript
headers: {
  "Authorization": `Bearer ${localStorage.getItem("session_id")}`
}
```

**Backend Verification (FastAPI example):**
```python
from fastapi import Depends, Header, HTTPException

async def verify_session(authorization: str = Header(...)):
    token = authorization.split(" ")[1]
    # Connect to DB and check if token exists in 'sessions' table
    # ...
```

## 8. Customization Checklist
- [ ] **Change Port**: If `8009` is taken, update `auth.py` (bottom lines) and your Frontend API calls.
- [ ] **CORS**: In `auth.py`, `allow_origins=["*"]` is for dev. Change to your frontend domain in production.
- [ ] **Database**: Update `get_db_connection()` variables in `auth.py` if you rename env vars.
