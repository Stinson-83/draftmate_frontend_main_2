"""Minimal FastAPI app for translation job creation."""

import os
from pathlib import Path
from typing import Generator

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.translator.crud import (
    create_translation_job as create_job_record,
    delete_translation_job as delete_job_record,
    get_translation_job,
    list_translation_jobs,
    serialize_translation_job,
    TranslationJobNotFoundError,
)
from backend.translator.database import DATABASE_URL, SessionLocal, engine
from backend.translator.models import Base
from backend.translator.storage import delete_local_file, get_original_upload_path
from backend.translator.security import (
    VirusScanError,
    UploadValidationError,
    build_download_response,
    scan_bytes_with_clamav,
    store_bytes_at_rest,
    validate_upload,
)
from backend.translator.tasks import process_translation_job

MAX_UPLOAD_BYTES = int(os.getenv("TRANSLATOR_MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))

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
    contents = await file.read(MAX_UPLOAD_BYTES + 1)

    try:
        validate_upload(file.filename, file.content_type, contents)
        scan_bytes_with_clamav(contents, filename=file.filename)
    except (UploadValidationError, VirusScanError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    file_path = get_original_upload_path(file.filename)
    store_bytes_at_rest(file_path, contents)

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

    return serialize_translation_job(job)


@app.get("/translation-jobs")
def list_translation_jobs_view(
    user_id: str | None = Header(default=None, alias="X-User-Id"),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, list[dict[str, str | int | bool | None]] | int]:
    jobs = list_translation_jobs(db, user_id=user_id, limit=limit)
    return {
        "jobs": [serialize_translation_job(job) for job in jobs],
        "total": len(jobs),
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

    download_name = translated_path.name.removesuffix(".enc")
    return build_download_response(translated_path, download_name=download_name)


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
