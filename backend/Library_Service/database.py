import logging
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD") or os.getenv("PSQL_PASSWD") or ""
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "postgres")

POSTGRES_DSN = (
    os.getenv("POSTGRES_DSN")
    or os.getenv("DATABASE_URL")
    or f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)


def _postgres_driver_url(dsn: str) -> str:
    """Use psycopg2 driver. SQLAlchemy otherwise selects psycopg (v3), which is not installed."""
    if not dsn:
        return ""
    if dsn.startswith("postgresql+psycopg2://") or dsn.startswith("sqlite"):
        return dsn
    if dsn.startswith("postgresql://"):
        return "postgresql+psycopg2://" + dsn[len("postgresql://"):]
    if dsn.startswith("postgres://"):
        return "postgresql+psycopg2://" + dsn[len("postgres://"):]
    return dsn


def _is_postgres_dsn(dsn: str) -> bool:
    if not dsn:
        return False
    lower = dsn.strip().lower()
    return (
        lower.startswith("postgresql://")
        or lower.startswith("postgresql+psycopg2://")
        or lower.startswith("postgres://")
    )


raw_env = os.getenv("ENVIRONMENT")
env = raw_env.strip().lower() if raw_env else ""

# Production mode takes strict precedence over every SQLite fallback override.
is_production = env in ("production", "prod")

# Only explicitly approved development/test environments are eligible for local fallback.
is_approved_dev = env in ("development", "dev", "local", "test")

# SQLite fallback is allowed ONLY when NOT in production AND in an approved development environment.
# If ENVIRONMENT is unset, unknown, or production, fail safely (no SQLite fallback permitted).
allow_sqlite_fallback = (not is_production) and is_approved_dev

if allow_sqlite_fallback:
    # Explicit development mode: try PostgreSQL first; fall back to local SQLite if unreachable
    try:
        if not _is_postgres_dsn(POSTGRES_DSN):
            scheme_label = POSTGRES_DSN.split('://')[0] if '://' in POSTGRES_DSN else 'invalid'
            raise ValueError(f"Non-PostgreSQL DSN configured in development: {scheme_label}")
        engine = create_engine(_postgres_driver_url(POSTGRES_DSN), pool_pre_ping=True)
        with engine.connect() as _test_conn:
            _test_conn.execute(text("SELECT 1"))
        logger.info(f"[Library DB] Connected to PostgreSQL at {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
    except Exception as dev_err:
        sqlite_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "login_db", "auth_fallback.db")
        logger.warning(
            f"[Library DB] Development mode: PostgreSQL unavailable ({dev_err}). "
            f"Using local SQLite fallback: {sqlite_path}"
        )
        engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
else:
    # Production / unset / non-dev: fail-closed safety. SQLite fallback is STRICTLY FORBIDDEN.
    if not _is_postgres_dsn(POSTGRES_DSN):
        scheme_label = POSTGRES_DSN.split('://')[0] if '://' in POSTGRES_DSN else 'empty/missing'
        msg = (
            f"[Library DB] CRITICAL: Unsupported database scheme '{scheme_label}' for non-development environment! "
            f"A valid postgresql:// DSN is required. SQLite and non-PostgreSQL databases are rejected in production."
        )
        logger.critical(msg)
        raise RuntimeError(msg)

    try:
        engine = create_engine(_postgres_driver_url(POSTGRES_DSN), pool_pre_ping=True)
        with engine.connect() as _test_conn:
            _test_conn.execute(text("SELECT 1"))
        logger.info(f"[Library DB] Connected to PostgreSQL at {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
    except Exception as exc:
        logger.critical(
            f"[Library DB] CRITICAL: PostgreSQL connection failed!\n"
            f"  Host: {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}\n"
            f"  Error: {exc}\n"
            f"  SQLite fallback is DISABLED in production to prevent silent data loss.\n"
            f"  Check POSTGRES_DSN / POSTGRES_HOST environment variables."
        )
        raise RuntimeError(
            f"Library Service database connection failed: PostgreSQL unavailable ({POSTGRES_HOST}:{POSTGRES_PORT}). "
            f"SQLite fallback is disabled."
        ) from exc

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
