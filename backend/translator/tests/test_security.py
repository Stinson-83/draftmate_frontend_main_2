from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest
from cryptography.fernet import Fernet

from backend.translator.security import (
    UPLOAD_MAGIC,
    VirusScanError,
    UploadValidationError,
    open_secure_storage_file,
    scan_bytes_with_clamav,
    store_bytes_at_rest,
    validate_upload,
)


def test_validate_upload_rejects_oversized_files(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRANSLATOR_MAX_UPLOAD_BYTES", "10")

    with pytest.raises(UploadValidationError, match="exceeds the maximum allowed size"):
        validate_upload("report.pdf", "application/pdf", b"%PDF-" + b"x" * 20)


def test_validate_upload_accepts_pdf_signature(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRANSLATOR_MAX_UPLOAD_BYTES", "1024")

    result = validate_upload("report.pdf", "application/pdf", b"%PDF-1.7\ncontent")

    assert result.file_extension == ".pdf"
    assert result.mime_type == "application/pdf"


def test_store_bytes_at_rest_encrypts_and_decrypts(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRANSLATOR_ENCRYPT_FILES_AT_REST", "true")
    monkeypatch.setenv("TRANSLATOR_ENCRYPTION_KEY", Fernet.generate_key().decode("utf-8"))

    stored_path = tmp_path / "sample.pdf"
    original_bytes = b"%PDF-1.7 test payload"

    store_bytes_at_rest(stored_path, original_bytes)

    raw_bytes = stored_path.read_bytes()
    assert raw_bytes.startswith(UPLOAD_MAGIC)

    with open_secure_storage_file(stored_path) as decrypted_path:
        assert decrypted_path.read_bytes() == original_bytes


class _FakeConnection:
    def __init__(self, response: bytes) -> None:
        self.response = response
        self.sent_chunks: list[bytes] = []

    def sendall(self, chunk: bytes) -> None:
        self.sent_chunks.append(chunk)

    def recv(self, _size: int) -> bytes:
        return self.response

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_scan_bytes_with_clamav_accepts_clean_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRANSLATOR_CLAMAV_SCAN_ENABLED", "true")
    monkeypatch.setenv("TRANSLATOR_CLAMAV_REQUIRED", "true")
    fake_connection = _FakeConnection(b"stream: OK")
    monkeypatch.setattr("backend.translator.security.socket.create_connection", lambda *args, **kwargs: fake_connection)

    scan_bytes_with_clamav(b"%PDF-1.7 test payload", filename="sample.pdf")

    assert fake_connection.sent_chunks


def test_scan_bytes_with_clamav_raises_on_infection(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TRANSLATOR_CLAMAV_SCAN_ENABLED", "true")
    monkeypatch.setenv("TRANSLATOR_CLAMAV_REQUIRED", "true")
    fake_connection = _FakeConnection(b"stream: Eicar-Test-Signature FOUND")
    monkeypatch.setattr("backend.translator.security.socket.create_connection", lambda *args, **kwargs: fake_connection)

    with pytest.raises(VirusScanError, match="Virus scan failed"):
        scan_bytes_with_clamav(b"malicious content", filename="bad.pdf")
