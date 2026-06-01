"""CRUD helpers for translation jobs."""

from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from backend.translator.models.translation_job import TranslationJob


class TranslationJobNotFoundError(Exception):
    """Raised when a translation job cannot be found."""


def serialize_translation_job(job: TranslationJob) -> dict[str, str | int | bool | None]:
    return {
        "job_id": job.id,
        "file_name": Path(job.source_file).name,
        "status": job.status,
        "stage": job.stage,
        "progress": job.progress,
        "target_language": job.target_language,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "download_available": job.status == "completed" and bool(job.translated_file),
    }


def create_translation_job(
    session: Session,
    *,
    user_id: Optional[str],
    source_file: str,
    target_language: str,
) -> TranslationJob:
    job = TranslationJob(
        user_id=user_id,
        status="queued",
        stage="queued",
        progress=0,
        source_file=source_file,
        translated_file=None,
        target_language=target_language,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def get_translation_job(session: Session, job_id: int) -> TranslationJob | None:
    return session.query(TranslationJob).filter(TranslationJob.id == job_id).first()


def list_translation_jobs(
    session: Session,
    *,
    user_id: Optional[str],
    limit: int = 20,
) -> list[TranslationJob]:
    query = session.query(TranslationJob)
    if user_id is None:
        return []

    return (
        query.filter(TranslationJob.user_id == user_id)
        .order_by(TranslationJob.created_at.desc(), TranslationJob.id.desc())
        .limit(limit)
        .all()
    )


def delete_translation_job(session: Session, job_id: int) -> TranslationJob:
    job = get_translation_job(session, job_id)
    if job is None:
        raise TranslationJobNotFoundError("Translation job not found")

    session.delete(job)
    session.commit()
    return job


def update_translation_job(
    session: Session,
    job_id: int,
    *,
    status: str | None = None,
    stage: str | None = None,
    progress: int | None = None,
    translated_file: str | None = None,
) -> TranslationJob:
    job = get_translation_job(session, job_id)
    if job is None:
        raise TranslationJobNotFoundError("Translation job not found")

    if status is not None:
        job.status = status
    if stage is not None:
        job.stage = stage
    if progress is not None:
        job.progress = progress
    if translated_file is not None:
        job.translated_file = translated_file

    session.commit()
    session.refresh(job)
    return job

