"""Minimal FastAPI app for translation job creation."""

from pathlib import Path
from typing import Generator
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.translator.crud import create_translation_job as create_job_record
from backend.translator.database import SessionLocal
from backend.translator.models import Base
from backend.translator.models.translation_job import TranslationJob
from backend.translator.database import engine

app = FastAPI(title="Translator Service", version="0.1.0")

Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def healthcheck() -> dict[str, str]:
    return {"message": "Translator service running"}


@app.post("/translation-jobs")
async def create_translation_job(
    file: UploadFile = File(...),
    target_language: str = Form(...),
    user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict[str, str | int | None]:
    uploads_dir = Path(__file__).resolve().parent.parent / "data" / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid4()}_{file.filename or 'document'}"
    file_path = uploads_dir / unique_name
    contents = await file.read()
    file_path.write_bytes(contents)

    job = create_job_record(
        db,
        user_id=user_id,
        source_file=str(file_path),
        target_language=target_language,
    )

    return {
        "job_id": job.id,
        "status": job.status,
        "target_language": job.target_language,
    }
