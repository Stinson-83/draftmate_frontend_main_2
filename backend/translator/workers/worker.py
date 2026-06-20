"""Celery worker for translator jobs."""

import logging
import os
from dataclasses import replace
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
from backend.translator.translators.sarvam_translate import sarvam_translate
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


def _translate_blocks(blocks: list[object], source_language: str, target_language: str) -> list[object]:
    translated_texts = sarvam_translate(
        [block.text for block in blocks],
        src_lang=source_language,
        tgt_lang=target_language,
    )

    if len(translated_texts) != len(blocks):
        raise ValueError("Sarvam AI returned an unexpected number of translations")

    translated_blocks: list[object] = []
    for block, translated_text in zip(blocks, translated_texts, strict=True):
        translated_blocks.append(
            replace(
                block,
                text=translated_text,
                style={
                    **block.style,
                    "source_language": source_language,
                    "target_language": target_language,
                    "translation_provider": "sarvam_translate_api",
                },
            )
        )

    return translated_blocks


def _run_pipeline(session, job: TranslationJob) -> None:
    with open_secure_storage_file(job.source_file) as source_path:
        blocks, output_ext, rebuilder = _extract_blocks(source_path)
        _set_job_state(session, job.id, status="processing", stage="extracted", progress=20)

        translated_blocks = _translate_blocks(
            blocks,
            source_language=job.source_language or _source_language(),
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


def main() -> None:
    _bootstrap_database()
    loglevel = os.getenv("CELERY_LOG_LEVEL", "INFO")
    celery_app.worker_main([
        "worker",
        "--loglevel",
        loglevel,
    ])


if __name__ == "__main__":
    main()
