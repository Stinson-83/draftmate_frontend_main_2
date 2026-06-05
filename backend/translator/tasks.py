"""Celery tasks for translator jobs."""

import os

from celery import Celery


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


@celery_app.task(name="backend.translator.tasks.process_translation_job")
def process_translation_job(job_id: int, source_file: str, target_language: str) -> dict[str, str | int]:
    return {
        "job_id": job_id,
        "source_file": source_file,
        "target_language": target_language,
        "status": "queued",
    }

