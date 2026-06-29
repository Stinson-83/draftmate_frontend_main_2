from __future__ import annotations

from pathlib import Path

import pytest

from backend.translator.extractors.models import Block
from backend.translator.models.translation_job import TranslationJob
from backend.translator.workers import worker


class _Query:
    def __init__(self, job: TranslationJob) -> None:
        self.job = job

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def first(self):
        return self.job


class _Session:
    def __init__(self, job: TranslationJob) -> None:
        self.job = job
        self.commits = 0

    def query(self, model):
        return _Query(self.job)

    def commit(self):
        self.commits += 1

    def refresh(self, job):
        return None

    def delete(self, job):
        return None


class _SessionFactory:
    def __init__(self, session: _Session) -> None:
        self.session = session

    def __call__(self):
        return _SessionContext(self.session)


class _SessionContext:
    def __init__(self, session: _Session) -> None:
        self.session = session

    def __enter__(self):
        return self.session

    def __exit__(self, exc_type, exc, tb):
        return False


@pytest.mark.parametrize(
    ("source_language", "target_language", "translated_text"),
    [
        ("hi-IN", "en-IN", "hello"),
        ("en-IN", "hi-IN", "नमस्ते"),
        ("mr-IN", "gu-IN", "નમસ્તે"),
        ("gu-IN", "mr-IN", "नमस्कार"),
    ],
)
def test_worker_processes_job_end_to_end(monkeypatch, tmp_path: Path, source_language: str, target_language: str, translated_text: str) -> None:
    source_file = tmp_path / "input.pdf"
    source_file.write_text("stub", encoding="utf-8")

    job = TranslationJob(
        id=1,
        user_id="user-1",
        status="queued",
        stage="queued",
        progress=0,
        source_file=str(source_file),
        source_language=source_language,
        translated_file=None,
        target_language=target_language,
    )

    session = _Session(job)

    monkeypatch.setattr(worker, "SessionLocal", _SessionFactory(session))
    monkeypatch.setattr(worker, "_source_language", lambda: "auto")
    monkeypatch.setattr(worker, "extract_pdf_blocks", lambda path: [Block(id=1, type="paragraph", text="hello", bounding_box=(0.0, 0.0, 1.0, 1.0), style={})])
    monkeypatch.setattr(worker, "sarvam_translate", lambda texts, src_lang, tgt_lang: [translated_text])

    def _rebuilder(blocks, output_path):
        output_path = Path(output_path)
        output_path.write_text(" | ".join(block.text for block in blocks), encoding="utf-8")
        return output_path

    monkeypatch.setattr(worker, "rebuild_pdf_document", _rebuilder)
    monkeypatch.setattr(worker, "get_translated_upload_path", lambda filename: tmp_path / f"translated_{filename}")
    monkeypatch.setattr(worker, "update_translation_job", lambda session_obj, job_id, **kwargs: _apply_update(job, kwargs))

    from backend.translator.tasks import process_translation_job
    from backend.translator import tasks, crud
    monkeypatch.setattr(crud, "get_translation_job", lambda db_obj, job_id: job)
    monkeypatch.setattr(tasks, "SessionLocal", _SessionFactory(session))

    process_translation_job(1, str(source_file), target_language)

    assert job.status == "completed"
    assert job.stage == "completed"
    assert job.progress == 100
    assert job.translated_file is not None
    assert Path(job.translated_file).exists()
    assert Path(job.translated_file).read_text(encoding="utf-8") == translated_text


def test_worker_marks_job_failed_when_translation_fails(monkeypatch, tmp_path: Path) -> None:
    source_file = tmp_path / "input.pdf"
    source_file.write_text("stub", encoding="utf-8")

    job = TranslationJob(
        id=2,
        user_id="user-1",
        status="queued",
        stage="queued",
        progress=0,
        source_file=str(source_file),
        source_language="en-IN",
        translated_file=None,
        target_language="hi",
    )

    session = _Session(job)

    monkeypatch.setattr(worker, "SessionLocal", _SessionFactory(session))
    monkeypatch.setattr(worker, "_source_language", lambda: "en")
    monkeypatch.setattr(worker, "extract_pdf_blocks", lambda path: [Block(id=1, type="paragraph", text="hello", bounding_box=(0.0, 0.0, 1.0, 1.0), style={})])

    def _raise(*args, **kwargs):
        raise RuntimeError("Sarvam translation unavailable")

    monkeypatch.setattr(worker, "sarvam_translate", _raise)
    monkeypatch.setattr(worker, "update_translation_job", lambda session_obj, job_id, **kwargs: _apply_update(job, kwargs))

    from backend.translator.tasks import process_translation_job
    from backend.translator import tasks, crud
    monkeypatch.setattr(crud, "get_translation_job", lambda db_obj, job_id: job)
    monkeypatch.setattr(tasks, "SessionLocal", _SessionFactory(session))

    process_translation_job(2, str(source_file), "hi")

    assert job.status == "failed"
    assert job.stage == "failed"
    assert job.progress == 0


def _apply_update(job: TranslationJob, kwargs: dict[str, object]) -> TranslationJob:
    if kwargs.get("status") is not None:
        job.status = str(kwargs["status"])
    if kwargs.get("stage") is not None:
        job.stage = str(kwargs["stage"])
    if kwargs.get("progress") is not None:
        job.progress = int(kwargs["progress"])
    if kwargs.get("translated_file") is not None:
        job.translated_file = str(kwargs["translated_file"])
    return job
