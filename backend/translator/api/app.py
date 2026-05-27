"""Minimal FastAPI app for translation job creation."""

from typing import Generator

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.translator.crud import create_translation_job as create_job_record
from backend.translator.database import DATABASE_URL, SessionLocal, engine
from backend.translator.models import Base
from backend.translator.storage import get_original_upload_path
from backend.translator.tasks import process_translation_job

app = FastAPI(title="Translator Service", version="0.1.0")

if engine is not None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise HTTPException(status_code=500, detail="Database is not configured")

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
    file_path = get_original_upload_path(file.filename)
    contents = await file.read()
    file_path.write_bytes(contents)

    job = create_job_record(
        db,
        user_id=user_id,
        source_file=str(file_path),
        target_language=target_language,
    )

    process_translation_job.delay(job.id, str(file_path), target_language)

    return {
        "job_id": job.id,
        "status": job.status,
        "target_language": job.target_language,
    }
