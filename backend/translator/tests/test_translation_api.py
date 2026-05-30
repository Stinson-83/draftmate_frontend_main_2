from __future__ import annotations

import asyncio
import importlib
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException


class _FakeSession:
    def __init__(self) -> None:
        self.added = []

    def add(self, job):
        job.id = 101
        job.created_at = datetime.now(timezone.utc)
        self.added.append(job)

    def commit(self):
        return None

    def refresh(self, job):
        return None


class _Delay:
    def __init__(self) -> None:
        self.calls = []

    def delay(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return None


class _UploadFile:
    def __init__(self, filename: str, content_type: str, content: bytes) -> None:
        self.filename = filename
        self.content_type = content_type
        self._content = content

    async def read(self, _size: int | None = None) -> bytes:
        return self._content


@pytest.fixture()
def translator_app(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("TRANSLATOR_DATABASE_URL", "sqlite+pysqlite:///:memory:")
    db_module = importlib.import_module("backend.translator.database")
    monkeypatch.setattr(db_module, "DATABASE_URL", "", raising=False)
    monkeypatch.setattr(db_module, "engine", None, raising=False)
    monkeypatch.setattr(db_module, "SessionLocal", None, raising=False)
    sys.modules.pop("backend.translator.api.app", None)
    module = importlib.import_module("backend.translator.api.app")
    module.app.dependency_overrides.clear()
    yield module
    module.app.dependency_overrides.clear()


def test_translation_job_api_accepts_supported_indian_pair(translator_app, monkeypatch: pytest.MonkeyPatch, tmp_path):
    session = _FakeSession()
    delay = _Delay()

    monkeypatch.setattr(translator_app, "process_translation_job", delay)
    monkeypatch.setattr(translator_app, "validate_upload", lambda *args, **kwargs: None)
    monkeypatch.setattr(translator_app, "scan_bytes_with_clamav", lambda *args, **kwargs: None)
    monkeypatch.setattr(translator_app, "store_bytes_at_rest", lambda path, contents: Path(path).write_bytes(contents))
    monkeypatch.setattr(translator_app, "get_original_upload_path", lambda filename: tmp_path / filename)

    translator_app.app.dependency_overrides[translator_app.get_db] = lambda: session

    response = asyncio.run(
        translator_app.create_translation_job(
            file=_UploadFile("sample.pdf", "application/pdf", b"%PDF-1.7\nhello"),
            source_language="hi-IN",
            target_language="en-IN",
            user_id="user-1",
            db=session,
        )
    )

    assert response["source_language"] == "hi-IN"
    assert response["target_language"] == "en-IN"
    assert delay.calls


@pytest.mark.parametrize(
    ("source_language", "target_language", "message"),
    [
        ("xx-IN", "hi-IN", "Unsupported source language for Sarvam AI"),
        ("hi-IN", "xx-IN", "Unsupported target language for Sarvam AI"),
    ],
)
def test_translation_job_api_rejects_unsupported_languages(translator_app, source_language, target_language, message):
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            translator_app.create_translation_job(
                file=_UploadFile("sample.pdf", "application/pdf", b"%PDF-1.7\nhello"),
                source_language=source_language,
                target_language=target_language,
                db=_FakeSession(),
            )
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == message