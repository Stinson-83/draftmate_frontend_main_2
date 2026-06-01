"""Celery worker for translator jobs."""

import logging
import os
from pathlib import Path
from typing import Callable

from celery.schedules import schedule

from backend.translator.crud import update_translation_job
from backend.translator.extractors.docx import extract_docx_blocks
from backend.translator.extractors.pdf import extract_pdf_blocks
from backend.translator.database import SessionLocal, init_engine
from backend.translator.models import Base
from backend.translator.models.translation_job import TranslationJob
from backend.translator.rebuilders import rebuild_docx_document, rebuild_html_document, rebuild_pdf_document
from backend.translator.storage.paths import get_translated_upload_path
from backend.translator.security import open_secure_storage_file, store_bytes_at_rest
from backend.translator.translators import translate_blocks
from backend.translator.tasks import celery_app

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=os.getenv("CELERY_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


def _bootstrap_database() -> None:
    engine = init_engine()
    if engine is not None:
        Base.metadata.create_all(bind=engine)


def _source_language() -> str:
    return os.getenv("TRANSLATOR_SOURCE_LANGUAGE", "auto").strip() or "auto"


def _extract_blocks(source_path: Path) -> tuple[list[object], str, Callable]:
    suffix = source_path.suffix.lower()
    if suffix == ".pdf":
        return extract_pdf_blocks(source_path), "pdf", rebuild_pdf_document
    if suffix == ".docx":
        return extract_docx_blocks(source_path), "docx", rebuild_docx_document
    if suffix in {".html", ".htm"}:
        from backend.translator.extractors.html import extract_html_blocks

        return extract_html_blocks(source_path), "html", rebuild_html_document

    raise ValueError(f"Unsupported source file type: {source_path.suffix}")


def _set_job_state(session, job_id: int, *, status: str, stage: str, progress: int) -> None:
    update_translation_job(session, job_id, status=status, stage=stage, progress=progress)


def _run_pipeline(session, job: TranslationJob) -> None:
    with open_secure_storage_file(job.source_file) as source_path:
        blocks, output_ext, rebuilder = _extract_blocks(source_path)
        _set_job_state(session, job.id, status="processing", stage="extracted", progress=20)

        translated_blocks = translate_blocks(
            blocks,
            source_language=_source_language(),
            target_language=job.target_language,
        )
        _set_job_state(session, job.id, status="processing", stage="translated", progress=60)

        translated_filename = f"{source_path.stem}_{job.target_language}{'.' + output_ext}"
        output_path = get_translated_upload_path(translated_filename)
        _set_job_state(session, job.id, status="processing", stage="rebuilding", progress=85)

        rebuilt_path = rebuilder(translated_blocks, output_path)
        _set_job_state(session, job.id, status="processing", stage="storing", progress=95)

        store_bytes_at_rest(rebuilt_path, rebuilt_path.read_bytes())

        update_translation_job(
            session,
            job.id,
            status="completed",
            stage="completed",
            progress=100,
            translated_file=str(rebuilt_path),
        )


def _process_next_job() -> None:
    if SessionLocal is None:
        logger.warning("Translator database is not configured; skipping job poll")
        return

    with SessionLocal() as session:
        job = (
            session.query(TranslationJob)
            .filter(TranslationJob.status == "queued")
            .order_by(TranslationJob.created_at.asc(), TranslationJob.id.asc())
            .first()
        )

        if job is None:
            logger.info("No queued translation jobs found")
            return

        logger.info("Processing translation job %s", job.id)
        _set_job_state(session, job.id, status="processing", stage="extracting", progress=10)

        try:
            _run_pipeline(session, job)
            logger.info("Completed translation job %s", job.id)
        except Exception:
            logger.exception("Failed to process translation job %s", job.id)
            update_translation_job(session, job.id, status="failed", stage="failed", progress=0)


@celery_app.task(name="backend.translator.workers.worker.poll_translation_jobs")
def poll_translation_jobs() -> str:
    _process_next_job()
    return "ok"


celery_app.conf.beat_schedule = {
    "poll-translation-jobs-every-5-seconds": {
        "task": "backend.translator.workers.worker.poll_translation_jobs",
        "schedule": schedule(run_every=5.0),
    }
}


def main() -> None:
    _bootstrap_database()
    loglevel = os.getenv("CELERY_LOG_LEVEL", "INFO")
    celery_app.worker_main([
        "worker",
        "--loglevel",
        loglevel,
        "--beat",
    ])


if __name__ == "__main__":
    main()
