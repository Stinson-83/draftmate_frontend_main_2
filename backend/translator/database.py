"""Database helpers for the translator service."""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

def _get_database_url() -> str:
    return (
        os.getenv("TRANSLATOR_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_DSN")
        or "postgresql://lawuser:Siddchick2506@free-lawdb-useast1.cqrmc40e80ow.us-east-1.rds.amazonaws.com:5432/postgres"
    )

DATABASE_URL = _get_database_url()

engine = None
SessionLocal = None

def init_engine():
    """Create the SQLAlchemy engine and session factory once a database URL is available."""
    global engine, SessionLocal

    if not DATABASE_URL:
        return None

    if engine is None:
        # Crucial Fix: Removed the custom hardcoded 'connect_args' dictionary 
        # to ensure Python 3.14 types do not cause a crash.
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True
        )
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    return engine

init_engine()