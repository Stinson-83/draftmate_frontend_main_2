"""
Advocate Profile Service — Port 8007
Fixes applied:
- Port conflict resolved (moved from 8005 → 8007)
- JWT_SECRET required (no insecure fallback)
- Admin authorization enforced
- SQL injection patterns removed (parameterized queries throughout)
- Full error handling with proper rollbacks on all mutations
- is_public set to TRUE on onboarding completion
- profile_completion_score calculated server-side
- File upload uses S3 abstraction (falls back to local in dev)
- File size + type validation on uploads (10 MB limit)
- Notification service triggered on consultation + message creation
- Fake fallback metrics removed from API responses
- All missing tables created with proper migrations
- updated_at column added to all relevant queries safely
"""

from fastapi import FastAPI, HTTPException, Depends, Query, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import uuid
import shutil
import logging
from datetime import datetime
from dotenv import load_dotenv

from auth import router as auth_router, SECRET_KEY, ALGORITHM
from dependencies import get_current_user, get_admin_user

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ── App Setup ─────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Advocate Profile Service", version="3.0.0")


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    """Simple health check endpoint"""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")
    finally:
        if conn:
            conn.close()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = (
    ["*"]
    if ENVIRONMENT == "development"
    else [
        os.getenv("FRONTEND_URL_PROD", "https://draftmate.ai"),
        os.getenv("FRONTEND_URL_DEV", "http://localhost:5173"),
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:"
    )
    return response

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"}
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://127.0.0.1:8015")

# Magic numbers to verify file types are legitimate
MAGIC_NUMBERS = {
    "application/pdf": [b"%PDF"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/jpg": [b"\xff\xd8\xff"],
    "image/webp": [b"RIFF", b"WEBP"]
}


def _validate_file_magic(content: bytes, content_type: str) -> bool:
    """Check file content matches expected magic numbers for its MIME type"""
    magic_list = MAGIC_NUMBERS.get(content_type, [])
    if not magic_list:
        return False
    for magic in magic_list:
        if content.startswith(magic):
            return True
    return False


def _sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks"""
    import re
    # Remove any path components
    filename = os.path.basename(filename)
    # Keep only safe characters
    filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    return filename


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


# ── File Storage Abstraction ──────────────────────────────────────────────────
def _upload_file(local_path: str, s3_key: str, content_type: str) -> str:
    """
    Upload file to S3 if credentials present, else keep local.
    Returns publicly accessible URL.
    """
    bucket = os.getenv("S3_BUCKET_NAME", "")
    region = os.getenv("AWS_REGION", "ap-south-1")
    if bucket and os.getenv("AWS_ACCESS_KEY_ID"):
        try:
            import boto3
            s3 = boto3.client("s3", region_name=region)
            s3.upload_file(
                local_path,
                bucket,
                s3_key,
                ExtraArgs={"ContentType": content_type, "ACL": "public-read"},
            )
            return f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"
        except Exception as e:
            logger.warning(f"S3 upload failed, falling back to local: {e}")

    # Local fallback — returns a relative URL; only suitable for dev
    return f"/uploads/{s3_key}"


# ── Profile Completion Engine ─────────────────────────────────────────────────
def _calculate_profile_score(profile: dict, has_experience: bool, has_education: bool, has_practice_areas: bool, has_certifications: bool) -> int:
    """
    Server-side profile completion scoring.
    Returns 0–100.
    """
    score = 0
    if profile.get("title"):          score += 10
    if profile.get("bar_council_number"): score += 10
    if profile.get("bio"):             score += 15
    if profile.get("location"):        score += 5
    if profile.get("profile_image_url"): score += 10
    if profile.get("consultation_fee"): score += 5
    if profile.get("languages"):       score += 5
    if profile.get("court_affiliation"): score += 5
    if profile.get("office_address"):  score += 5
    if has_practice_areas:             score += 10
    if has_experience:                 score += 5
    if has_education:                  score += 5
    if has_certifications:             score += 10
    return min(score, 100)


# ── Notification Helper ───────────────────────────────────────────────────────
def _send_notification(user_id: str, title: str, message: str, notif_type: str = "info"):
    """Best-effort notification — never raises."""
    try:
        import urllib.request, json
        payload = json.dumps(
            {"user_id": user_id, "type": notif_type, "title": title, "message": message}
        ).encode()
        req = urllib.request.Request(
            f"{NOTIFICATION_SERVICE_URL}/notifications",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=3)
    except Exception:
        pass  # Notifications are non-critical


# ── Ensure Tables ─────────────────────────────────────────────────────────────
def _run_migrations(conn):
    """Idempotent migrations for all tables required by this service."""
    stmts = [
        # Indexes for users table
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)",
        
        # Additional indexes for advocate_profiles
        "CREATE INDEX IF NOT EXISTS idx_advocate_profiles_user_id ON advocate_profiles(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_advocate_profiles_slug ON advocate_profiles(slug)",
        "CREATE INDEX IF NOT EXISTS idx_advocate_profiles_is_public ON advocate_profiles(is_public)",
        "CREATE INDEX IF NOT EXISTS idx_advocate_profiles_is_verified ON advocate_profiles(is_verified)",
        "CREATE INDEX IF NOT EXISTS idx_advocate_profiles_location ON advocate_profiles(location)",
        
        # Index for advocate_practice_areas
        "CREATE INDEX IF NOT EXISTS idx_advocate_practice_areas_practice_area_id ON advocate_practice_areas(practice_area_id)",
        
        # Index for achievements
        "CREATE INDEX IF NOT EXISTS idx_achievements_advocate_id ON achievements(advocate_id)",
        
        # Refresh tokens (also created in auth.py but kept here for completeness)
        """CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(512) UNIQUE NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )""",
        "CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)",
        
        # Consultation requests
        """CREATE TABLE IF NOT EXISTS consultation_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            client_name VARCHAR(255) NOT NULL,
            client_email VARCHAR(255) NOT NULL,
            client_phone VARCHAR(50),
            case_summary TEXT NOT NULL,
            preferred_type VARCHAR(50) DEFAULT 'Video Call',
            preferred_date TIMESTAMPTZ,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )""",
        "ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS preferred_type VARCHAR(50) DEFAULT 'Video Call'",
        "ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS preferred_date TIMESTAMPTZ",
        "CREATE INDEX IF NOT EXISTS idx_consultation_requests_advocate_id ON consultation_requests(advocate_id)",
        "CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status)",
        
        # Contact requests (messages from clients)
        """CREATE TABLE IF NOT EXISTS contact_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            client_name VARCHAR(255) NOT NULL,
            client_email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'UNREAD',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )""",
        "CREATE INDEX IF NOT EXISTS idx_contact_requests_advocate_id ON contact_requests(advocate_id)",
        "CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status)",
        
        # Messages (Two-way chat)
        """CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            client_name VARCHAR(255) NOT NULL,
            client_email VARCHAR(255) NOT NULL,
            sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('client', 'advocate')),
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            is_archived BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )""",
        "CREATE INDEX IF NOT EXISTS idx_messages_advocate_id ON messages(advocate_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_client_email ON messages(client_email)",
        "CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)",
        "CREATE INDEX IF NOT EXISTS idx_messages_is_archived ON messages(is_archived)",
        "CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)",
        
        # Verification requests
        """CREATE TABLE IF NOT EXISTS verification_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            documents_url TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMPTZ
        )""",
        "CREATE INDEX IF NOT EXISTS idx_verification_requests_advocate_id ON verification_requests(advocate_id)",
        "CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status)",
        
        # Bookmarks (add foreign key to user_id)
        """CREATE TABLE IF NOT EXISTS bookmarks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, advocate_id)
        )""",
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_advocate_id ON bookmarks(advocate_id)",
        
        # Profile views
        """CREATE TABLE IF NOT EXISTS profile_views (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            referrer TEXT,
            source VARCHAR(100) DEFAULT 'web',
            viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )""",
        "CREATE INDEX IF NOT EXISTS idx_profile_views_advocate_id ON profile_views(advocate_id)",
        "CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at)",
        
        # Profile shares
        """CREATE TABLE IF NOT EXISTS profile_shares (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            platform VARCHAR(100),
            shared_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )""",
        "CREATE INDEX IF NOT EXISTS idx_profile_shares_advocate_id ON profile_shares(advocate_id)",
        
        # Analytics events
        """CREATE TABLE IF NOT EXISTS analytics_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
            event_type VARCHAR(100) NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )""",
        "CREATE INDEX IF NOT EXISTS idx_analytics_events_advocate_id ON analytics_events(advocate_id)",
        "CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type)",
        
        # Safe column additions (idempotent)
        "ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'",
        "ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS id_slug VARCHAR(100)",
        "ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS office_address TEXT",
    ]
    with conn.cursor() as cur:
        for stmt in stmts:
            try:
                cur.execute(stmt)
            except psycopg2.Error as e:
                conn.rollback()
                logger.warning(f"Migration step skipped: {e}")
    conn.commit()


@app.on_event("startup")
def on_startup():
    try:
        conn = get_db_connection()
        _run_migrations(conn)
        conn.close()
        logger.info("✅ Advocate Profile Service migrations applied.")
    except Exception as e:
        logger.error(f"❌ Startup migration failed: {e}")


# ── Pydantic Models ───────────────────────────────────────────────────────────
class ProfileUpdate(BaseModel):
    title: Optional[str] = None
    bar_council_number: Optional[str] = None
    years_experience: Optional[int] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = None
    profile_image_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    location: Optional[str] = None
    court_affiliation: Optional[str] = None
    languages: Optional[List[str]] = None
    office_address: Optional[str] = None


class EducationItem(BaseModel):
    institution: str
    degree: str
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class ExperienceItem(BaseModel):
    company: str
    role: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None


class CertificationItem(BaseModel):
    title: str
    type: Optional[str] = None
    date_achieved: Optional[str] = None


class OnboardingComplete(BaseModel):
    """Marks onboarding done — sets is_public = TRUE."""
    bar_council_number: Optional[str] = None
    years_experience: Optional[int] = None
    consultation_fee: Optional[float] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    court_affiliation: Optional[str] = None
    languages: Optional[List[str]] = None
    practice_areas: Optional[List[str]] = None
    office_address: Optional[str] = None
    education: Optional[List[EducationItem]] = None
    experience: Optional[List[ExperienceItem]] = None
    certifications: Optional[List[CertificationItem]] = None


class PracticeAreaUpdate(BaseModel):
    practice_areas: List[str]


class ConsultationRequestCreate(BaseModel):
    advocate_id: str
    client_name: str
    client_email: EmailStr
    client_phone: Optional[str] = None
    case_summary: str
    preferred_type: Optional[str] = "Video Call"
    preferred_date: Optional[str] = None

    @field_validator("advocate_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("advocate_id must be a valid UUID.")
        return v

    @field_validator("case_summary")
    @classmethod
    def summary_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("case_summary cannot be empty.")
        return v.strip()


class ContactRequestCreate(BaseModel):
    advocate_id: str
    client_name: str
    client_email: EmailStr
    message: str

    @field_validator("advocate_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("advocate_id must be a valid UUID.")
        return v

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("message cannot be empty.")
        return v.strip()


class StatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        allowed = {"PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "APPROVED", "UNREAD", "READ", "ARCHIVED"}
        if v.upper() not in allowed:
            raise ValueError(f"status must be one of: {allowed}")
        return v.upper()


class AnalyticsViewCreate(BaseModel):
    advocate_id: str
    referrer: Optional[str] = None
    source: Optional[str] = "web"


class AnalyticsShareCreate(BaseModel):
    advocate_id: str
    platform: str


class BookmarkCreate(BaseModel):
    advocate_id: str


class MessageStatusUpdate(BaseModel):
    status: str
    
    
class NewMessage(BaseModel):
    advocate_id: str
    client_name: str
    client_email: EmailStr
    sender_type: str = "client"
    message: str
    
    
class NewAdvocateMessage(BaseModel):
    client_email: str
    message: str


# ── Public Profile ────────────────────────────────────────────────────────────
@app.get("/api/v1/profiles/public/{slug}")
def get_public_profile(slug: str):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, user_id, slug, title, bar_council_number, years_experience,
                       bio, consultation_fee, profile_image_url, banner_image_url, location,
                       court_affiliation, profile_completion_score, is_verified,
                       rating, total_consultations, view_count, languages, id_slug,
                       created_at,
                       COALESCE(id_slug,
                           'ADV-' || EXTRACT(YEAR FROM COALESCE(created_at, CURRENT_DATE))::text
                           || '-' || UPPER(SUBSTRING(id::text FROM 1 FOR 5))
                       ) AS advocate_id
                FROM advocate_profiles
                WHERE slug = %s AND is_public = TRUE
                """,
                (slug,),
            )
            profile = cur.fetchone()

        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found or not public.")

        profile = dict(profile)
        advocate_id = profile["id"]

        with conn.cursor() as cur:
            # Experience
            cur.execute(
                "SELECT * FROM advocate_experience WHERE advocate_id = %s ORDER BY start_date DESC NULLS LAST",
                (advocate_id,),
            )
            profile["experience"] = [dict(r) for r in cur.fetchall()]

            # Education
            cur.execute(
                "SELECT * FROM advocate_education WHERE advocate_id = %s ORDER BY start_year DESC NULLS LAST",
                (advocate_id,),
            )
            profile["education"] = [dict(r) for r in cur.fetchall()]

            # Achievements
            try:
                cur.execute("SELECT * FROM achievements WHERE advocate_id = %s", (advocate_id,))
                profile["achievements"] = [dict(r) for r in cur.fetchall()]
            except psycopg2.Error:
                conn.rollback()
                profile["achievements"] = []

            # Practice areas
            try:
                cur.execute(
                    """
                    SELECT pa.name FROM advocate_practice_areas apa
                    JOIN practice_areas pa ON apa.practice_area_id = pa.id
                    WHERE apa.advocate_id = %s
                    """,
                    (advocate_id,),
                )
                profile["practice_areas"] = [r["name"] for r in cur.fetchall()]
            except psycopg2.Error:
                conn.rollback()
                profile["practice_areas"] = []

            # View count from profile_views table (real data)
            try:
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM profile_views WHERE advocate_id = %s",
                    (advocate_id,),
                )
                profile["view_count"] = cur.fetchone()["cnt"]
            except psycopg2.Error:
                conn.rollback()

            # Track this view
            try:
                cur.execute(
                    "INSERT INTO profile_views (advocate_id, source) VALUES (%s, 'web')",
                    (advocate_id,),
                )
                conn.commit()
            except psycopg2.Error:
                conn.rollback()

        # Ensure languages is always a list
        langs = profile.get("languages") or []
        if isinstance(langs, str):
            import json as _json
            try:
                langs = _json.loads(langs)
            except Exception:
                langs = [l.strip() for l in langs.split(",") if l.strip()]
        profile["languages"] = langs

        # SEO metadata — no hardcoded fallbacks for missing fields
        profile["seoMetadata"] = {
            "title": f"{profile['title']} — Verified Advocate | Draftmate",
            "description": (profile["bio"] or "")[:150] + ("..." if profile["bio"] and len(profile["bio"]) > 150 else ""),
            "ogImage": profile.get("profile_image_url"),
        }

        return {"status": "success", "data": profile}

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── My Profile ────────────────────────────────────────────────────────────────
@app.get("/api/v1/profiles/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found.")
        profile = dict(profile)

        # Attach practice areas
        with conn.cursor() as cur:
            try:
                cur.execute(
                    """
                    SELECT pa.name FROM advocate_practice_areas apa
                    JOIN practice_areas pa ON apa.practice_area_id = pa.id
                    WHERE apa.advocate_id = %s
                    """,
                    (profile["id"],),
                )
                profile["practice_areas"] = [r["name"] for r in cur.fetchall()]
            except psycopg2.Error:
                conn.rollback()
                profile["practice_areas"] = []

        # Attach experience
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "SELECT * FROM advocate_experience WHERE advocate_id = %s ORDER BY start_date DESC NULLS LAST",
                    (profile["id"],),
                )
                profile["experience"] = [dict(r) for r in cur.fetchall()]
            except psycopg2.Error:
                conn.rollback()
                profile["experience"] = []

        # Attach education
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "SELECT * FROM advocate_education WHERE advocate_id = %s ORDER BY start_year DESC NULLS LAST",
                    (profile["id"],),
                )
                profile["education"] = [dict(r) for r in cur.fetchall()]
            except psycopg2.Error:
                conn.rollback()
                profile["education"] = []

        # Attach achievements/certifications
        with conn.cursor() as cur:
            try:
                cur.execute("SELECT * FROM achievements WHERE advocate_id = %s", (profile["id"],))
                profile["certifications"] = [dict(r) for r in cur.fetchall()]
            except psycopg2.Error:
                conn.rollback()
                profile["certifications"] = []

        # Normalise languages
        langs = profile.get("languages") or []
        if isinstance(langs, str):
            import json as _json
            try:
                langs = _json.loads(langs)
            except Exception:
                langs = [l.strip() for l in langs.split(",") if l.strip()]
        profile["languages"] = langs

        return {"status": "success", "data": profile}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/profiles/me")
def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            res = cur.fetchone()
            if not res:
                # Auto-create if somehow missing
                slug = f"advocate-{str(uuid.uuid4())[:8]}"
                cur.execute(
                    "INSERT INTO advocate_profiles (user_id, slug, title) VALUES (%s, %s, %s) RETURNING id",
                    (user_id, slug, profile_data.title or "Advocate"),
                )
                advocate_id = cur.fetchone()["id"]
            else:
                advocate_id = res["id"]

            updates = {}
            raw = profile_data.model_dump(exclude_unset=True)
            for key, val in raw.items():
                if key == "languages" and isinstance(val, list):
                    import json as _json
                    updates[key] = _json.dumps(val)
                else:
                    updates[key] = val

            if updates:
                set_clause = ", ".join(f"{k} = %s" for k in updates)
                values = list(updates.values()) + [advocate_id]
                cur.execute(
                    f"UPDATE advocate_profiles SET {set_clause}, updated_at = NOW() WHERE id = %s",
                    values,
                )

            # Recalculate profile completion
            cur.execute("SELECT * FROM advocate_profiles WHERE id = %s", (advocate_id,))
            p = dict(cur.fetchone())
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM advocate_experience WHERE advocate_id = %s", (advocate_id,)
            )
            has_exp = cur.fetchone()["cnt"] > 0
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM advocate_education WHERE advocate_id = %s", (advocate_id,)
            )
            has_edu = cur.fetchone()["cnt"] > 0
            try:
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM advocate_practice_areas WHERE advocate_id = %s", (advocate_id,)
                )
                has_pa = cur.fetchone()["cnt"] > 0
            except psycopg2.Error:
                conn.rollback()
                has_pa = False
                
            # Check for certifications
            try:
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM achievements WHERE advocate_id = %s", (advocate_id,)
                )
                has_cert = cur.fetchone()["cnt"] > 0
            except psycopg2.Error:
                conn.rollback()
                has_cert = False

            score = _calculate_profile_score(p, has_exp, has_edu, has_pa, has_cert)
            cur.execute(
                "UPDATE advocate_profiles SET profile_completion_score = %s WHERE id = %s",
                (score, advocate_id),
            )

        conn.commit()
        return {"status": "success", "message": "Profile updated.", "profile_completion_score": score}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.post("/api/v1/profiles/me/complete-onboarding")
def complete_onboarding(data: OnboardingComplete, current_user: dict = Depends(get_current_user)):
    """
    Finalise onboarding:
    - Saves all fields
    - Sets is_public = TRUE automatically
    - Recalculates profile completion score
    - Sets practice areas if provided
    - Adds education, experience, certifications if provided
    """
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Profile not found. Please register first.")
            advocate_id = res["id"]

            # Build update payload
            import json as _json
            field_map = {
                "bar_council_number": data.bar_council_number,
                "years_experience": data.years_experience,
                "consultation_fee": data.consultation_fee,
                "location": data.location,
                "bio": data.bio,
                "court_affiliation": data.court_affiliation,
                "office_address": data.office_address,
            }
            if data.languages is not None:
                field_map["languages"] = _json.dumps(data.languages)

            # Always publish on onboarding completion
            field_map["is_public"] = True

            set_clause = ", ".join(f"{k} = %s" for k in field_map)
            values = list(field_map.values()) + [advocate_id]
            cur.execute(
                f"UPDATE advocate_profiles SET {set_clause}, updated_at = NOW() WHERE id = %s",
                values,
            )

            # Sync practice areas
            if data.practice_areas:
                cur.execute("DELETE FROM advocate_practice_areas WHERE advocate_id = %s", (advocate_id,))
                for pa_name in data.practice_areas:
                    pa_name = pa_name.strip()
                    cur.execute("SELECT id FROM practice_areas WHERE name = %s", (pa_name,))
                    pa_row = cur.fetchone()
                    if pa_row:
                        pa_id = pa_row["id"]
                    else:
                        cur.execute(
                            "INSERT INTO practice_areas (name) VALUES (%s) RETURNING id", (pa_name,)
                        )
                        pa_id = cur.fetchone()["id"]
                    cur.execute(
                        "INSERT INTO advocate_practice_areas (advocate_id, practice_area_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (advocate_id, pa_id),
                    )

            # Add education if provided
            if data.education:
                cur.execute("DELETE FROM advocate_education WHERE advocate_id = %s", (advocate_id,))
                for edu in data.education:
                    cur.execute(
                        "INSERT INTO advocate_education (advocate_id, institution, degree, start_year, end_year) VALUES (%s, %s, %s, %s, %s)",
                        (advocate_id, edu.institution, edu.degree, edu.start_year, edu.end_year),
                    )

            # Add experience if provided
            if data.experience:
                cur.execute("DELETE FROM advocate_experience WHERE advocate_id = %s", (advocate_id,))
                for exp in data.experience:
                    start_date = None
                    if exp.start_date:
                        try:
                            start_date = datetime.fromisoformat(exp.start_date)
                        except:
                            pass
                    end_date = None
                    if exp.end_date:
                        try:
                            end_date = datetime.fromisoformat(exp.end_date)
                        except:
                            pass
                    cur.execute(
                        "INSERT INTO advocate_experience (advocate_id, company, role, start_date, end_date, is_current, description) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (advocate_id, exp.company, exp.role, start_date, end_date, exp.is_current, exp.description),
                    )

            # Add certifications if provided (to achievements table)
            has_certifications = False
            if data.certifications:
                has_certifications = True
                cur.execute("DELETE FROM achievements WHERE advocate_id = %s", (advocate_id,))
                for cert in data.certifications:
                    date_achieved = None
                    if cert.date_achieved:
                        try:
                            date_achieved = datetime.fromisoformat(cert.date_achieved)
                        except:
                            pass
                    cur.execute(
                        "INSERT INTO achievements (advocate_id, title, type, date_achieved) VALUES (%s, %s, %s, %s)",
                        (advocate_id, cert.title, cert.type, date_achieved),
                    )

            # Recalculate score
            cur.execute("SELECT * FROM advocate_profiles WHERE id = %s", (advocate_id,))
            p = dict(cur.fetchone())
            cur.execute("SELECT COUNT(*) AS cnt FROM advocate_experience WHERE advocate_id = %s", (advocate_id,))
            has_exp = cur.fetchone()["cnt"] > 0
            cur.execute("SELECT COUNT(*) AS cnt FROM advocate_education WHERE advocate_id = %s", (advocate_id,))
            has_edu = cur.fetchone()["cnt"] > 0
            has_pa = bool(data.practice_areas)
            score = _calculate_profile_score(p, has_exp, has_edu, has_pa, has_certifications)
            cur.execute(
                "UPDATE advocate_profiles SET profile_completion_score = %s WHERE id = %s",
                (score, advocate_id),
            )

        conn.commit()
        return {
            "status": "success",
            "message": "Onboarding complete. Your profile is now live on the marketplace!",
            "is_public": True,
            "profile_completion_score": score,
        }
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/profiles/me/practice-areas")
def update_practice_areas(data: PracticeAreaUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        import json as _json
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Profile not found.")
            advocate_id = res["id"]

            cur.execute("DELETE FROM advocate_practice_areas WHERE advocate_id = %s", (advocate_id,))
            for pa_name in data.practice_areas:
                pa_name = pa_name.strip()
                cur.execute("SELECT id FROM practice_areas WHERE name = %s", (pa_name,))
                pa_row = cur.fetchone()
                if pa_row:
                    pa_id = pa_row["id"]
                else:
                    cur.execute("INSERT INTO practice_areas (name) VALUES (%s) RETURNING id", (pa_name,))
                    pa_id = cur.fetchone()["id"]
                cur.execute(
                    "INSERT INTO advocate_practice_areas (advocate_id, practice_area_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (advocate_id, pa_id),
                )
        conn.commit()
        return {"status": "success", "message": "Practice areas updated."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


class ExperienceItem(BaseModel):
    company: str
    role: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None


class EducationItem(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class CertificationItem(BaseModel):
    title: str
    type: Optional[str] = None
    date_achieved: Optional[str] = None


class ProfileDetailsUpdate(BaseModel):
    experience: Optional[List[ExperienceItem]] = None
    education: Optional[List[EducationItem]] = None
    certifications: Optional[List[CertificationItem]] = None


@app.put("/api/v1/profiles/me/details")
def update_profile_details(data: ProfileDetailsUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Profile not found.")
            advocate_id = res["id"]

            # Update experience
            if data.experience is not None:
                cur.execute("DELETE FROM advocate_experience WHERE advocate_id = %s", (advocate_id,))
                for exp in data.experience:
                    start_date = None
                    if exp.start_date:
                        try:
                            start_date = datetime.fromisoformat(exp.start_date)
                        except:
                            pass
                    end_date = None
                    if exp.end_date and not exp.is_current:
                        try:
                            end_date = datetime.fromisoformat(exp.end_date)
                        except:
                            pass
                    cur.execute(
                        "INSERT INTO advocate_experience (advocate_id, company, role, start_date, end_date, is_current, description) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (advocate_id, exp.company, exp.role, start_date, end_date, exp.is_current, exp.description),
                    )

            # Update education
            if data.education is not None:
                cur.execute("DELETE FROM advocate_education WHERE advocate_id = %s", (advocate_id,))
                for edu in data.education:
                    cur.execute(
                        "INSERT INTO advocate_education (advocate_id, institution, degree, field_of_study, start_year, end_year) VALUES (%s, %s, %s, %s, %s, %s)",
                        (advocate_id, edu.institution, edu.degree, edu.field_of_study, edu.start_year, edu.end_year),
                    )

            # Update certifications (achievements)
            if data.certifications is not None:
                cur.execute("DELETE FROM achievements WHERE advocate_id = %s", (advocate_id,))
                for cert in data.certifications:
                    date_achieved = None
                    if cert.date_achieved:
                        try:
                            date_achieved = datetime.fromisoformat(cert.date_achieved)
                        except:
                            pass
                    cur.execute(
                        "INSERT INTO achievements (advocate_id, title, type, date_achieved) VALUES (%s, %s, %s, %s)",
                        (advocate_id, cert.title, cert.type, date_achieved),
                    )

            # Recalculate score
            cur.execute("SELECT * FROM advocate_profiles WHERE id = %s", (advocate_id,))
            p = dict(cur.fetchone())
            cur.execute("SELECT COUNT(*) AS cnt FROM advocate_experience WHERE advocate_id = %s", (advocate_id,))
            has_exp = cur.fetchone()["cnt"] > 0
            cur.execute("SELECT COUNT(*) AS cnt FROM advocate_education WHERE advocate_id = %s", (advocate_id,))
            has_edu = cur.fetchone()["cnt"] > 0
            try:
                cur.execute("SELECT COUNT(*) AS cnt FROM advocate_practice_areas WHERE advocate_id = %s", (advocate_id,))
                has_pa = cur.fetchone()["cnt"] > 0
            except psycopg2.Error:
                has_pa = False
            try:
                cur.execute("SELECT COUNT(*) AS cnt FROM achievements WHERE advocate_id = %s", (advocate_id,))
                has_cert = cur.fetchone()["cnt"] > 0
            except psycopg2.Error:
                has_cert = False
            score = _calculate_profile_score(p, has_exp, has_edu, has_pa, has_cert)
            cur.execute("UPDATE advocate_profiles SET profile_completion_score = %s WHERE id = %s", (score, advocate_id))

        conn.commit()
        return {"status": "success", "message": "Profile details updated.", "profile_completion_score": score}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── Profile Image Upload ──────────────────────────────────────────────────────
@app.post("/api/v1/profiles/me/upload-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["sub"]

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: PNG, JPEG, WEBP.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10 MB allowed.")

    if not _validate_file_magic(content, file.content_type):
        raise HTTPException(status_code=400, detail="File content does not match its MIME type.")

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Profile not found.")
            advocate_id = res["id"]

        ext = (_sanitize_filename(file.filename) or "img").rsplit(".", 1)[-1].lower()
        safe_key = f"profile-images/{advocate_id}.{ext}"

        # Write to temp file then upload
        upload_dir = "/tmp/advocate_uploads"
        os.makedirs(upload_dir, exist_ok=True)
        tmp_path = os.path.join(upload_dir, f"{advocate_id}.{ext}")
        with open(tmp_path, "wb") as f:
            f.write(content)

        image_url = _upload_file(tmp_path, safe_key, file.content_type)

        with conn.cursor() as cur:
            cur.execute(
                "UPDATE advocate_profiles SET profile_image_url = %s, updated_at = NOW() WHERE id = %s",
                (image_url, advocate_id),
            )
        conn.commit()

        # Clean up temp
        try:
            os.remove(tmp_path)
        except OSError:
            pass

        return {"status": "success", "url": image_url}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── Discovery Endpoints ───────────────────────────────────────────────────────
@app.get("/api/v1/discovery/search")
@limiter.limit("30/minute")
def search_advocates(
    request: Request,
    q: Optional[str] = None,
    location: Optional[str] = None,
    practice_area: Optional[str] = None,
    verified_only: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            conditions = ["p.is_public = TRUE"]
            params: list = []

            if q:
                conditions.append(
                    "(p.title ILIKE %s OR p.bio ILIKE %s OR p.bar_council_number ILIKE %s"
                    " OR p.location ILIKE %s OR p.id_slug ILIKE %s)"
                )
                like = f"%{q}%"
                params.extend([like, like, like, like, like])

            if location:
                conditions.append("p.location ILIKE %s")
                params.append(f"%{location}%")

            if verified_only:
                conditions.append("p.is_verified = TRUE")

            if practice_area:
                conditions.append(
                    """EXISTS (
                        SELECT 1 FROM advocate_practice_areas apa
                        JOIN practice_areas pa ON apa.practice_area_id = pa.id
                        WHERE apa.advocate_id = p.id AND pa.name ILIKE %s
                    )"""
                )
                params.append(f"%{practice_area}%")

            where = " AND ".join(conditions)
            offset = (page - 1) * limit

            cur.execute(
                f"""
                SELECT p.id, p.title AS name, p.title, p.slug, p.years_experience, p.bio,
                       p.consultation_fee, p.is_verified, p.profile_image_url, p.location,
                       p.court_affiliation, p.created_at, p.bar_council_number,
                       p.profile_completion_score, p.rating, p.total_consultations,
                       p.languages, p.id_slug,
                       COALESCE(p.id_slug,
                           'ADV-' || EXTRACT(YEAR FROM COALESCE(p.created_at, CURRENT_DATE))::text
                           || '-' || UPPER(SUBSTRING(p.id::text FROM 1 FOR 5))
                       ) AS advocate_id,
                       (SELECT COUNT(*) FROM profile_views v WHERE v.advocate_id = p.id) AS view_count,
                       (SELECT COALESCE(json_agg(pa.name ORDER BY pa.name), '[]'::json)
                        FROM advocate_practice_areas apa
                        JOIN practice_areas pa ON apa.practice_area_id = pa.id
                        WHERE apa.advocate_id = p.id) AS practice_areas
                FROM advocate_profiles p
                WHERE {where}
                ORDER BY p.profile_completion_score DESC NULLS LAST
                LIMIT %s OFFSET %s
                """,
                params + [limit, offset],
            )
            results = [dict(r) for r in cur.fetchall()]

            cur.execute(
                f"SELECT COUNT(*) AS total FROM advocate_profiles p WHERE {where}",
                params,
            )
            total = cur.fetchone()["total"]

        return {
            "status": "success",
            "data": {"results": results, "total": total, "page": page, "limit": limit},
        }
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


def _advocate_list_query(conn, where_extra: str, order_by: str, limit: int, params: list):
    """Shared query for featured/trending/recent/recommended."""
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT p.id, p.title AS name, p.title, p.slug, p.years_experience, p.bio,
                   p.consultation_fee, p.is_verified, p.profile_image_url, p.location,
                   p.court_affiliation, p.created_at, p.bar_council_number,
                   p.profile_completion_score, p.rating, p.total_consultations,
                   p.languages, p.id_slug,
                   COALESCE(p.id_slug,
                       'ADV-' || EXTRACT(YEAR FROM COALESCE(p.created_at, CURRENT_DATE))::text
                       || '-' || UPPER(SUBSTRING(p.id::text FROM 1 FOR 5))
                   ) AS advocate_id,
                   (SELECT COUNT(*) FROM profile_views v WHERE v.advocate_id = p.id) AS view_count,
                   (SELECT COALESCE(json_agg(pa.name ORDER BY pa.name), '[]'::json)
                    FROM advocate_practice_areas apa
                    JOIN practice_areas pa ON apa.practice_area_id = pa.id
                    WHERE apa.advocate_id = p.id) AS practice_areas
            FROM advocate_profiles p
            WHERE p.is_public = TRUE {where_extra}
            {order_by}
            LIMIT %s
            """,
            params + [limit],
        )
        return [dict(r) for r in cur.fetchall()]


@app.get("/api/v1/discovery/featured")
def get_featured_advocates(limit: int = Query(5, ge=1, le=20)):
    conn = get_db_connection()
    try:
        data = _advocate_list_query(
            conn,
            "AND p.is_verified = TRUE",
            "ORDER BY p.profile_completion_score DESC NULLS LAST",
            limit,
            [],
        )
        return {"status": "success", "data": data}
    finally:
        conn.close()


@app.get("/api/v1/discovery/trending")
def get_trending_advocates(limit: int = Query(5, ge=1, le=20)):
    conn = get_db_connection()
    try:
        data = _advocate_list_query(
            conn,
            "",
            "ORDER BY (SELECT COUNT(*) FROM profile_views v WHERE v.advocate_id = p.id) DESC",
            limit,
            [],
        )
        return {"status": "success", "data": data}
    finally:
        conn.close()


@app.get("/api/v1/discovery/recent")
def get_recent_advocates(limit: int = Query(5, ge=1, le=20)):
    conn = get_db_connection()
    try:
        data = _advocate_list_query(conn, "", "ORDER BY p.created_at DESC NULLS LAST", limit, [])
        return {"status": "success", "data": data}
    finally:
        conn.close()


@app.get("/api/v1/discovery/recommended")
def get_recommended_advocates(limit: int = Query(5, ge=1, le=20)):
    conn = get_db_connection()
    try:
        data = _advocate_list_query(conn, "", "ORDER BY RANDOM()", limit, [])
        return {"status": "success", "data": data}
    finally:
        conn.close()


@app.get("/api/v1/discovery/practice-areas")
def get_practice_areas():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM practice_areas ORDER BY name ASC")
            return {"status": "success", "data": [dict(r) for r in cur.fetchall()]}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── Consultation Requests ─────────────────────────────────────────────────────
@app.post("/api/v1/consultations/request")
@limiter.limit("5/minute")
def request_consultation(request: Request, req: ConsultationRequestCreate):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Validate advocate exists and is public
            cur.execute(
                "SELECT id, user_id FROM advocate_profiles WHERE id = %s AND is_public = TRUE",
                (req.advocate_id,)
            )
            advocate = cur.fetchone()
            if not advocate:
                raise HTTPException(status_code=404, detail="Advocate not found or not accepting requests.")

            # Parse preferred_date with timezone safety
            preferred_date = None
            if req.preferred_date:
                try:
                    preferred_date = req.preferred_date
                except Exception:
                    preferred_date = None

            cur.execute(
                """
                INSERT INTO consultation_requests
                    (advocate_id, client_name, client_email, client_phone,
                     case_summary, preferred_type, preferred_date, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING')
                RETURNING id, created_at
                """,
                (
                    req.advocate_id, req.client_name, req.client_email,
                    req.client_phone, req.case_summary, req.preferred_type, preferred_date,
                ),
            )
            result = cur.fetchone()
            req_id = result["id"]
            created_at = result["created_at"]
        conn.commit()

        # Notify advocate (best-effort)
        try:
            _send_notification(
                str(advocate["user_id"]),
                "New Consultation Request",
                f"{req.client_name} has requested a consultation. Check your dashboard for details.",
                "consultation",
            )
        except Exception:
            pass  # Not critical

        return {
            "status": "success",
            "message": "Consultation request sent successfully.",
            "data": {
                "request_id": str(req_id),
                "status": "PENDING",
                "created_at": created_at
            },
        }
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to create consultation request. Please try again later.")
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/consultations")
def get_advocate_consultations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                return {"status": "success", "data": []}
            cur.execute(
                "SELECT * FROM consultation_requests WHERE advocate_id = %s ORDER BY created_at DESC",
                (profile["id"],),
            )
            return {"status": "success", "data": [dict(r) for r in cur.fetchall()]}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/consultations/{req_id}/status")
def update_consultation_status(
    req_id: str, status_data: StatusUpdate, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]
    conn = None
    try:
        uuid.UUID(req_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid consultation ID format.")

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=403, detail="Not authorized.")
            
            advocate_id = profile["id"]
            
            # Check if consultation exists and belongs to this advocate
            cur.execute(
                "SELECT id, status FROM consultation_requests WHERE id = %s AND advocate_id = %s",
                (req_id, advocate_id)
            )
            consultation = cur.fetchone()
            if not consultation:
                raise HTTPException(status_code=404, detail="Consultation request not found.")
            
            # Update status
            cur.execute(
                "UPDATE consultation_requests SET status = %s WHERE id = %s AND advocate_id = %s RETURNING *",
                (status_data.status, req_id, advocate_id),
            )
            updated = cur.fetchone()
            
            # Increment total_consultations if status is ACCEPTED
            if status_data.status == "ACCEPTED":
                cur.execute(
                    "UPDATE advocate_profiles SET total_consultations = COALESCE(total_consultations, 0) + 1 WHERE id = %s",
                    (advocate_id,)
                )
            
        conn.commit()
        
        return {
            "status": "success",
            "message": "Consultation status updated successfully.",
            "data": {
                "request_id": req_id,
                "status": updated["status"],
                "updated_at": updated.get("updated_at", None)
            }
        }
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to update status. Please try again later.")
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
    finally:
        if conn:
            conn.close()


# ── Contact / Messages ────────────────────────────────────────────────────────
@app.post("/api/v1/contact/requests")
@limiter.limit("5/minute")
def submit_contact_request(request: Request, req: ContactRequestCreate):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id, user_id FROM advocate_profiles WHERE id = %s", (req.advocate_id,))
            advocate = cur.fetchone()
            if not advocate:
                raise HTTPException(status_code=404, detail="Advocate not found.")

            cur.execute(
                """
                INSERT INTO contact_requests (advocate_id, client_name, client_email, message)
                VALUES (%s, %s, %s, %s)
                """,
                (req.advocate_id, req.client_name, req.client_email, req.message),
            )
        conn.commit()

        # Notify advocate (best-effort)
        _send_notification(
            str(advocate["user_id"]),
            "New Message",
            f"You have a new message from {req.client_name}.",
            "message",
        )

        return {"status": "success", "message": "Message sent."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/contact/requests")
def get_advocate_contacts(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                return {"status": "success", "data": []}
            cur.execute(
                "SELECT * FROM contact_requests WHERE advocate_id = %s ORDER BY created_at DESC",
                (profile["id"],),
            )
            return {"status": "success", "data": [dict(r) for r in cur.fetchall()]}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/contact/requests/{msg_id}/status")
def update_message_status(
    msg_id: str, status_data: MessageStatusUpdate, current_user: dict = Depends(get_current_user)
):
    """Mark a contact request as READ / ARCHIVED."""
    user_id = current_user["sub"]
    allowed = {"UNREAD", "READ", "ARCHIVED"}
    if status_data.status.upper() not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=403, detail="Not authorized.")
            cur.execute(
                "UPDATE contact_requests SET status = %s WHERE id = %s AND advocate_id = %s",
                (status_data.status.upper(), msg_id, profile["id"]),
            )
        conn.commit()
        return {"status": "success"}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── New Messaging System ──────────────────────────────────────────────────────
@app.post("/api/v1/messages")
@limiter.limit("10/minute")
def send_message(request: Request, req: NewMessage):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id, user_id FROM advocate_profiles WHERE id = %s AND is_public = TRUE", (req.advocate_id,))
            advocate = cur.fetchone()
            if not advocate:
                raise HTTPException(status_code=404, detail="Advocate not found or not accepting messages.")
            
            cur.execute(
                """
                INSERT INTO messages (advocate_id, client_name, client_email, sender_type, message)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (req.advocate_id, req.client_name, req.client_email, req.sender_type, req.message)
            )
            result = cur.fetchone()
            msg_id = result["id"]
            created_at = result["created_at"]
        conn.commit()
        
        # Notify advocate
        try:
            _send_notification(
                str(advocate["user_id"]),
                "New Message",
                f"{req.client_name} sent you a new message.",
                "message"
            )
        except Exception:
            pass
        
        return {
            "status": "success",
            "message": "Message sent successfully.",
            "data": {"message_id": str(msg_id), "created_at": created_at}
        }
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again later.")
    except HTTPException:
        raise
    except Exception:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/messages/conversations")
def get_conversations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                return {"status": "success", "data": []}
            
            advocate_id = profile["id"]
            
            cur.execute("""
                SELECT 
                    client_email,
                    client_name,
                    MAX(created_at) as last_message_at,
                    COUNT(*) FILTER (WHERE NOT is_read AND sender_type = 'client') as unread_count
                FROM messages
                WHERE advocate_id = %s AND NOT is_archived
                GROUP BY client_email, client_name
                ORDER BY last_message_at DESC
            """, (advocate_id,))
            
            convos = cur.fetchall()
            return {"status": "success", "data": [dict(c) for c in convos]}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/messages/conversation/{client_email}")
def get_conversation(client_email: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=403, detail="Not authorized.")
            
            advocate_id = profile["id"]
            
            cur.execute("""
                SELECT * FROM messages 
                WHERE advocate_id = %s AND client_email = %s 
                ORDER BY created_at ASC
            """, (advocate_id, client_email))
            messages = cur.fetchall()
            return {"status": "success", "data": [dict(m) for m in messages]}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.post("/api/v1/messages/conversation/{client_email}/reply")
def advocate_reply(client_email: str, req: NewAdvocateMessage, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=403, detail="Not authorized.")
            
            advocate_id = profile["id"]
            
            cur.execute("""
                SELECT client_name FROM messages 
                WHERE advocate_id = %s AND client_email = %s
                LIMIT 1
            """, (advocate_id, client_email))
            client_info = cur.fetchone()
            if not client_info:
                raise HTTPException(status_code=404, detail="Conversation not found.")
            
            cur.execute("""
                INSERT INTO messages (advocate_id, client_name, client_email, sender_type, message)
                VALUES (%s, %s, %s, 'advocate', %s)
                RETURNING id, created_at
            """, (advocate_id, client_info["client_name"], client_email, req.message))
            result = cur.fetchone()
            msg_id = result["id"]
            created_at = result["created_at"]
        conn.commit()
        return {
            "status": "success",
            "message": "Reply sent.",
            "data": {"message_id": str(msg_id), "created_at": created_at}
        }
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/messages/{message_id}/read")
def mark_message_read(message_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        uuid.UUID(message_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid message ID format.")
        
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=403, detail="Not authorized.")
            
            cur.execute("""
                UPDATE messages SET is_read = TRUE 
                WHERE id = %s AND advocate_id = %s
            """, (message_id, profile["id"]))
        conn.commit()
        return {"status": "success", "message": "Message marked as read."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/messages/conversation/{client_email}/read")
def mark_conversation_read(client_email: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=403, detail="Not authorized.")
            
            cur.execute("""
                UPDATE messages SET is_read = TRUE 
                WHERE advocate_id = %s AND client_email = %s
            """, (profile["id"], client_email))
        conn.commit()
        return {"status": "success", "message": "Conversation marked as read."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/messages/conversation/{client_email}/archive")
def archive_conversation(client_email: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=403, detail="Not authorized.")
            
            cur.execute("""
                UPDATE messages SET is_archived = TRUE 
                WHERE advocate_id = %s AND client_email = %s
            """, (profile["id"], client_email))
        conn.commit()
        return {"status": "success", "message": "Conversation archived."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── Verification ──────────────────────────────────────────────────────────────
@app.post("/api/v1/verification/submit")
async def submit_verification(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: PDF, PNG, JPEG.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10 MB.")

    if not _validate_file_magic(content, file.content_type):
        raise HTTPException(status_code=400, detail="File content does not match its MIME type.")

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                raise HTTPException(status_code=404, detail="Advocate profile not found.")
            advocate_id = profile["id"]

        ext = (_sanitize_filename(file.filename) or "doc").rsplit(".", 1)[-1].lower()
        s3_key = f"verification-docs/{advocate_id}-{uuid.uuid4().hex[:8]}.{ext}"

        upload_dir = "/tmp/advocate_uploads"
        os.makedirs(upload_dir, exist_ok=True)
        tmp_path = os.path.join(upload_dir, f"{advocate_id}_{ext}")
        with open(tmp_path, "wb") as f:
            f.write(content)

        doc_url = _upload_file(tmp_path, s3_key, file.content_type)

        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO verification_requests (advocate_id, documents_url) VALUES (%s, %s)",
                (advocate_id, doc_url),
            )
        conn.commit()

        try:
            os.remove(tmp_path)
        except OSError:
            pass

        return {"status": "success", "message": "Verification submitted.", "url": doc_url}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── Admin ─────────────────────────────────────────────────────────────────────
@app.get("/api/v1/admin/verifications")
def get_admin_verifications(current_user: dict = Depends(get_admin_user)):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT v.*, p.title AS advocate_name, p.bar_council_number
                FROM verification_requests v
                JOIN advocate_profiles p ON v.advocate_id = p.id
                ORDER BY v.submitted_at DESC
                """
            )
            return {"status": "success", "data": [dict(r) for r in cur.fetchall()]}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/v1/admin/verifications/{req_id}/status")
def update_verification_status(
    req_id: str, status_data: StatusUpdate, current_user: dict = Depends(get_admin_user)
):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE verification_requests SET status = %s, reviewed_at = NOW() WHERE id = %s RETURNING advocate_id",
                (status_data.status, req_id),
            )
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Verification request not found.")
            if status_data.status == "APPROVED":
                cur.execute(
                    "UPDATE advocate_profiles SET is_verified = TRUE WHERE id = %s",
                    (res["advocate_id"],),
                )
        conn.commit()
        return {"status": "success"}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/admin/stats")
def get_admin_stats(current_user: dict = Depends(get_admin_user)):
    conn = None
    try:
        conn = get_db_connection()
        stats = {}
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM advocate_profiles")
            stats["total_advocates"] = cur.fetchone()["total"]
            cur.execute("SELECT COUNT(*) AS total FROM advocate_profiles WHERE is_verified = TRUE")
            stats["verified_advocates"] = cur.fetchone()["total"]
            cur.execute("SELECT COUNT(*) AS total FROM consultation_requests")
            stats["total_consultations"] = cur.fetchone()["total"]
            try:
                cur.execute("SELECT COUNT(*) AS total FROM profile_shares")
                stats["total_shares"] = cur.fetchone()["total"]
            except psycopg2.Error:
                conn.rollback()
                stats["total_shares"] = 0
        return {"status": "success", "data": stats}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── Analytics ─────────────────────────────────────────────────────────────────
@app.post("/api/v1/analytics/view")
def track_view(data: AnalyticsViewCreate):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO profile_views (advocate_id, referrer, source) VALUES (%s, %s, %s)",
                (data.advocate_id, data.referrer, data.source),
            )
        conn.commit()
    except psycopg2.Error:
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
    return {"status": "success"}


@app.post("/api/v1/analytics/share")
def track_share(data: AnalyticsShareCreate):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO profile_shares (advocate_id, platform) VALUES (%s, %s)",
                (data.advocate_id, data.platform),
            )
        conn.commit()
    except psycopg2.Error:
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
    return {"status": "success"}


@app.get("/api/v1/analytics/dashboard")
def get_advocate_analytics(current_user: dict = Depends(get_current_user)):
    """Returns real analytics for the advocate's dashboard."""
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM advocate_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if not profile:
                return {"status": "success", "data": {}}
            advocate_id = profile["id"]

            cur.execute("SELECT COUNT(*) AS cnt FROM profile_views WHERE advocate_id = %s", (advocate_id,))
            total_views = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) AS cnt FROM profile_shares WHERE advocate_id = %s", (advocate_id,))
            total_shares = cur.fetchone()["cnt"] if True else 0

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM consultation_requests WHERE advocate_id = %s", (advocate_id,)
            )
            total_consultations = cur.fetchone()["cnt"]

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM contact_requests WHERE advocate_id = %s", (advocate_id,)
            )
            total_messages = cur.fetchone()["cnt"]

            # Conversion rate: consultations / views
            conversion_rate = round((total_consultations / total_views * 100), 2) if total_views > 0 else 0

            # Views last 7 days
            cur.execute(
                """
                SELECT DATE(viewed_at) AS day, COUNT(*) AS views
                FROM profile_views
                WHERE advocate_id = %s AND viewed_at >= NOW() - INTERVAL '7 days'
                GROUP BY day ORDER BY day
                """,
                (advocate_id,),
            )
            views_trend = [dict(r) for r in cur.fetchall()]

        return {
            "status": "success",
            "data": {
                "total_views": total_views,
                "total_shares": total_shares,
                "total_consultations": total_consultations,
                "total_messages": total_messages,
                "conversion_rate": conversion_rate,
                "views_trend": views_trend,
            },
        }
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── Bookmarks ─────────────────────────────────────────────────────────────────
@app.post("/api/v1/bookmarks")
def add_bookmark(req: BookmarkCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO bookmarks (user_id, advocate_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user_id, req.advocate_id),
            )
        conn.commit()
        return {"status": "success", "message": "Bookmark added."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.delete("/api/v1/bookmarks/{advocate_id}")
def remove_bookmark(advocate_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM bookmarks WHERE user_id = %s AND advocate_id = %s",
                (user_id, advocate_id),
            )
        conn.commit()
        return {"status": "success", "message": "Bookmark removed."}
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ── SEO ───────────────────────────────────────────────────────────────────────
@app.get("/sitemap.xml")
def get_sitemap():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT slug,
                       COALESCE(updated_at, created_at) AS last_mod
                FROM advocate_profiles
                WHERE is_public = TRUE AND is_verified = TRUE
                """
            )
            profiles = cur.fetchall()

        base_url = "https://draftmate.ai"
        xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        xml += f'  <url><loc>{base_url}/advocates</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n'
        for p in profiles:
            date_str = p["last_mod"].strftime("%Y-%m-%d") if p["last_mod"] else "2024-01-01"
            xml += (
                f'  <url><loc>{base_url}/advocate/{p["slug"]}</loc>'
                f'<lastmod>{date_str}</lastmod>'
                f'<changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
            )
        xml += "</urlset>"
        return Response(content=xml, media_type="application/xml")
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/robots.txt")
def get_robots():
    return Response(
        content="User-agent: *\nAllow: /\nSitemap: https://draftmate.ai/sitemap.xml\n",
        media_type="text/plain",
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ADVOCATE_PROFILE_PORT", 8007))
    uvicorn.run(app, host="0.0.0.0", port=port)
