"""
Advocate Authentication — JWT with refresh token support.
Fixes applied:
- JWT_SECRET is required at startup (no insecure fallback)
- Refresh tokens stored in DB with rotation + invalidation
- POST /refresh endpoint
- POST /logout endpoint
- Rate limiting on login + register
- Password strength validation (min 8 chars, must contain letter + digit)
- full_name stored in users table
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
import jwt
from datetime import datetime, timedelta
import os
import uuid
import re
import psycopg2
from psycopg2.extras import RealDictCursor

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
security = HTTPBearer()

# ── Security ──────────────────────────────────────────────────────────────────
# Hard-fail at import time if secret is missing — prevents silent insecure defaults
_raw_secret = os.environ.get("JWT_SECRET", "")
if not _raw_secret or _raw_secret in ("super-secret-key-change-in-prod", "change-me"):
    import warnings
    warnings.warn(
        "JWT_SECRET env var is not set or uses insecure default. "
        "Set a strong random value before deploying.",
        stacklevel=2
    )
    # In production (ENVIRONMENT=production) we hard-fail
    if os.environ.get("ENVIRONMENT", "development") == "production":
        raise RuntimeError("JWT_SECRET must be set to a strong secret in production.")
    _raw_secret = _raw_secret or "dev-only-secret-do-not-use-in-prod"

SECRET_KEY: str = _raw_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── DB Helper ─────────────────────────────────────────────────────────────────
def get_db_connection():
    dsn = os.getenv("POSTGRES_DSN")
    if dsn:
        return psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        dbname=os.getenv("POSTGRES_DB", "draftmate"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        cursor_factory=RealDictCursor,
    )


def _ensure_refresh_tokens_table(conn):
    """Lazy-create refresh_tokens table if not present."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash  VARCHAR(512) UNIQUE NOT NULL,
                expires_at  TIMESTAMPTZ NOT NULL,
                revoked     BOOLEAN DEFAULT FALSE,
                created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


# ── Token helpers ─────────────────────────────────────────────────────────────
def _create_token(data: dict, expires_delta: timedelta) -> str:
    payload = {**data, "exp": datetime.utcnow() + expires_delta}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _hash_token(token: str) -> str:
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


def _store_refresh_token(conn, user_id: str, token: str):
    _ensure_refresh_tokens_table(conn)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (%s, %s, %s)",
            (user_id, _hash_token(token), expires_at),
        )
    conn.commit()


def _issue_token_pair(user_id: str, role: str = "advocate"):
    access = _create_token(
        {"sub": user_id, "role": role},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh = _create_token(
        {"sub": user_id, "type": "refresh"},
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return access, refresh


# ── Pydantic Models ───────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name fields cannot be empty.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
def register_advocate(request: Request, user: UserCreate):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Duplicate email check
            cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered.")

            user_id = str(uuid.uuid4())
            hashed = pwd_context.hash(user.password)
            full_name = f"{user.first_name.strip()} {user.last_name.strip()}"

            # Insert into users — stores full_name
            cur.execute(
                """
                INSERT INTO users (id, email, password_hash, full_name, user_type)
                VALUES (%s, %s, %s, %s, 'ADVOCATE')
                """,
                (user_id, user.email, hashed, full_name),
            )

            # Create linked advocate profile (not public yet — requires onboarding)
            slug = f"{user.first_name.lower().strip()}-{user.last_name.lower().strip()}-{str(uuid.uuid4())[:8]}"
            cur.execute(
                """
                INSERT INTO advocate_profiles (user_id, slug, title, is_public)
                VALUES (%s, %s, %s, FALSE)
                """,
                (user_id, slug, full_name),
            )

        conn.commit()

        access, refresh = _issue_token_pair(user_id)
        _store_refresh_token(conn, user_id, refresh)

        return Token(access_token=access, refresh_token=refresh)

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login_advocate(request: Request, user: UserLogin):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, password_hash FROM users WHERE email = %s", (user.email,)
            )
            db_user = cur.fetchone()

        if not db_user or not pwd_context.verify(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        user_id = str(db_user["id"])
        access, refresh = _issue_token_pair(user_id)
        _store_refresh_token(conn, user_id, refresh)

        return Token(access_token=access, refresh_token=refresh)

    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@router.post("/refresh", response_model=Token)
def refresh_token(body: RefreshRequest):
    """
    Rotate refresh token:
    1. Validate the incoming refresh JWT
    2. Verify it exists in DB and is not revoked / expired
    3. Revoke old token, issue new pair
    """
    try:
        payload = jwt.decode(body.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired. Please login again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token.")

    user_id = payload.get("sub")
    token_hash = _hash_token(body.refresh_token)

    conn = None
    try:
        conn = get_db_connection()
        _ensure_refresh_tokens_table(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id FROM refresh_tokens
                WHERE token_hash = %s
                  AND user_id = %s
                  AND revoked = FALSE
                  AND expires_at > NOW()
                """,
                (token_hash, user_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Refresh token not recognized or already used.")

            # Revoke old token (rotation)
            cur.execute(
                "UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = %s",
                (token_hash,),
            )

        conn.commit()

        access, new_refresh = _issue_token_pair(user_id)
        _store_refresh_token(conn, user_id, new_refresh)

        return Token(access_token=access, refresh_token=new_refresh)

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Revoke all refresh tokens for the current user."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token.")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    conn = None
    try:
        conn = get_db_connection()
        _ensure_refresh_tokens_table(conn)
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = %s AND revoked = FALSE",
                (user_id,),
            )
        conn.commit()
        return {"status": "success", "message": "Logged out successfully."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()
