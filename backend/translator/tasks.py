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

# Connect to your production AWS RDS database to update status markers dynamically
DATABASE_URL = "postgresql://lawuser:Siddchick2506@free-lawdb-useast1.cqrmc40e80ow.us-east-1.rds.amazonaws.com:5432/postgres"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@celery_app.task(name="backend.translator.tasks.process_translation_job")
def process_translation_job(job_id: int, source_file: str, target_language: str) -> dict[str, str | int]:
    print(f"[CELERY WORKER] Intercepted translation pipeline for job ID: {job_id}")
    
    db = SessionLocal()
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
        if 'job' in locals() and job:
            job.status = "failed"
            db.commit()
        return {"job_id": job_id, "status": "failed", "error": str(e)}
    finally:
        db.close()