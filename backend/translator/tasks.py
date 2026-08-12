"""Celery tasks for translator jobs."""

import os
import time
from pathlib import Path
from celery import Celery
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def _get_broker_url() -> str:
    return os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

def _get_result_backend() -> str:
    return os.getenv("CELERY_RESULT_BACKEND", _get_broker_url())

celery_app = Celery(
    "translator",
    broker=_get_broker_url(),
    backend=_get_result_backend(),
)

celery_app.conf.update(
    worker_hijack_root_logger=False,
    worker_redirect_stdouts=True,
    worker_redirect_stdouts_level="INFO",
)

from backend.translator.database import SessionLocal

@celery_app.task(name="backend.translator.tasks.process_translation_job")
def process_translation_job(job_id: int, source_file: str, target_language: str) -> dict[str, str | int]:
    print(f"[CELERY WORKER] Intercepted translation pipeline for job ID: {job_id}")
    
    if SessionLocal is None:
        print(f"[CELERY WORKER ERROR] Database is not configured!")
        return {"job_id": job_id, "status": "failed", "error": "Database not configured"}

    with SessionLocal() as db:
        try:
            from backend.translator.crud import get_translation_job
            job = get_translation_job(db, job_id)
            if not job:
                print(f"[CELERY WORKER ERROR] Job ID {job_id} was not found inside RDS!")
                return {"job_id": job_id, "status": "failed", "error": "Job not found"}
    
            # Run the real extraction, Sarvam translation, and document rebuilding pipeline
            from backend.translator.workers.worker import _run_pipeline
            _run_pipeline(db, job)
            db.refresh(job)
            
            print(f"[CELERY WORKER SUCCESS] Job ID {job_id} marked as completed!")
            return {
                "job_id": job_id,
                "source_file": source_file,
                "translated_file": job.translated_file,
                "target_language": target_language,
                "status": "completed",
            }
    
        except Exception as e:
            print(f"[CELERY RUNTIME EXCEPTION] Error processing pipeline: {e}")
            try:
                db.rollback()
            except Exception as rb_err:
                print(f"[CELERY WORKER] Rollback failed: {rb_err}")
            if 'job' in locals() and job:
                try:
                    job.status = "failed"
                    job.stage = "failed"
                    job.progress = 0
                    db.commit()
                except Exception as commit_err:
                    print(f"[CELERY WORKER] Failed to save error state to RDS: {commit_err}")
            return {"job_id": job_id, "status": "failed", "error": str(e)}