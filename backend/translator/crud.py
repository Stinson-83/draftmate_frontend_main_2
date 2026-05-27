"""CRUD helpers for translation jobs."""

from typing import Optional

from sqlalchemy.orm import Session

from backend.translator.models.translation_job import TranslationJob


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
        progress=0,
        source_file=source_file,
        translated_file=None,
        target_language=target_language,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job

