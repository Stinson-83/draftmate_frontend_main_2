"""Database helpers for the translator service."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.translator.models import Base


def _get_database_url() -> str:
    return (
        os.getenv("TRANSLATOR_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_DSN")
        or ""
    )


DATABASE_URL = _get_database_url()

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
