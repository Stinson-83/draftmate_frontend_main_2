"""Minimal FastAPI app for translation job creation."""

from pathlib import Path
from typing import Generator

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.translator.crud import (
    create_translation_job as create_job_record,
    delete_translation_job as delete_job_record,
    get_translation_job,
    TranslationJobNotFoundError,
)
from backend.translator.database import DATABASE_URL, SessionLocal, engine
from backend.translator.models import Base
from backend.translator.storage import delete_local_file, get_original_upload_path
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
        "stage": job.stage,
        "target_language": job.target_language,
    }


@app.get("/translation-jobs/{job_id}")
def get_translation_job_status(job_id: int, db: Session = Depends(get_db)) -> dict[str, str | int | None]:
    job = get_translation_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Translation job not found")

    return {
        "job_id": job.id,
        "status": job.status,
        "progress": job.progress,
        "stage": job.stage,
        "target_language": job.target_language,
    }


@app.get("/translation-jobs/{job_id}/download")
def download_translated_file(job_id: int, db: Session = Depends(get_db)):
    job = get_translation_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Translation job not found")

    if job.status != "completed" or not job.translated_file:
        raise HTTPException(status_code=404, detail="processing")

    translated_path = Path(job.translated_file)
    if not translated_path.exists():
        raise HTTPException(status_code=404, detail="Translated file not found")

    return FileResponse(path=translated_path, filename=translated_path.name)


@app.delete("/translation-jobs/{job_id}")
def delete_translation_job(job_id: int, db: Session = Depends(get_db)) -> dict[str, str | int]:
    job = get_translation_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Translation job not found")

    delete_local_file(job.source_file)
    delete_local_file(job.translated_file)
    try:
        delete_job_record(db, job_id)
    except TranslationJobNotFoundError:
        raise HTTPException(status_code=404, detail="Translation job not found")

    return {"job_id": job_id, "status": "deleted"}
