"""Security helpers for translator uploads and stored files."""

from __future__ import annotations

import io
import mimetypes
import os
import socket
import struct
import tempfile
import zipfile
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

from cryptography.fernet import Fernet, InvalidToken
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from backend.translator.storage.paths import delete_local_file, get_temp_work_dir

UPLOAD_MAGIC = b"TRNENC1\n"
SUPPORTED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/html": ".html",
}
SUPPORTED_EXTENSION_MAP = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".html": "text/html",
    ".htm": "text/html",
}


@dataclass(frozen=True)
class UploadValidationResult:
    file_extension: str
    mime_type: str


class UploadValidationError(ValueError):
    """Raised when an upload fails validation."""


class VirusScanError(ValueError):
    """Raised when a file is reported as infected or cannot be scanned."""


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _max_upload_bytes() -> int:
    return int(os.getenv("TRANSLATOR_MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))


def _encryption_enabled() -> bool:
    return _env_flag("TRANSLATOR_ENCRYPT_FILES_AT_REST", False)


def _fernet() -> Fernet | None:
    if not _encryption_enabled():
        return None

    key = os.getenv("TRANSLATOR_ENCRYPTION_KEY", "").strip()
    if not key:
        raise UploadValidationError("TRANSLATOR_ENCRYPTION_KEY is required when at-rest encryption is enabled")

    return Fernet(key.encode("utf-8"))


def _detect_file_type(filename: str | None, data: bytes) -> UploadValidationResult:
    extension = Path(filename or "").suffix.lower()
    expected_mime = SUPPORTED_EXTENSION_MAP.get(extension)
    if expected_mime is None:
        raise UploadValidationError("Unsupported file type. Only PDF, DOCX, and HTML files are allowed.")

    if extension == ".pdf":
        if not data.startswith(b"%PDF-"):
            raise UploadValidationError("Uploaded PDF file is invalid or corrupted.")
    elif extension == ".docx":
        with io.BytesIO(data) as buffer:
            if not zipfile.is_zipfile(buffer):
                raise UploadValidationError("Uploaded DOCX file is invalid or corrupted.")
            buffer.seek(0)
            with zipfile.ZipFile(buffer) as archive:
                required_parts = {"[Content_Types].xml", "word/document.xml"}
                if not required_parts.issubset(set(archive.namelist())):
                    raise UploadValidationError("Uploaded DOCX file is missing required document parts.")
    else:
        sample = data[:4096].decode("utf-8", errors="ignore").lstrip().lower()
        if not (sample.startswith("<!doctype html") or sample.startswith("<html") or "<body" in sample or "<head" in sample):
            raise UploadValidationError("Uploaded HTML file is invalid or corrupted.")

    return UploadValidationResult(file_extension=extension, mime_type=expected_mime)


def validate_upload(filename: str | None, content_type: str | None, data: bytes) -> UploadValidationResult:
    if len(data) == 0:
        raise UploadValidationError("Uploaded file is empty.")

    if len(data) > _max_upload_bytes():
        raise UploadValidationError("Uploaded file exceeds the maximum allowed size.")

    result = _detect_file_type(filename, data)

    normalized_content_type = (content_type or "").split(";", 1)[0].strip().lower()
    if normalized_content_type and normalized_content_type not in {result.mime_type, "application/octet-stream"}:
        raise UploadValidationError("Uploaded file MIME type does not match the file contents.")

    return result


def _clamav_address() -> tuple[str, int]:
    host = os.getenv("TRANSLATOR_CLAMAV_HOST", "clamav").strip() or "clamav"
    port = int(os.getenv("TRANSLATOR_CLAMAV_PORT", "3310"))
    return host, port


def scan_bytes_with_clamav(data: bytes, *, filename: str | None = None) -> None:
    if not _env_flag("TRANSLATOR_CLAMAV_SCAN_ENABLED", True):
        return

    host, port = _clamav_address()
    timeout = float(os.getenv("TRANSLATOR_CLAMAV_TIMEOUT_SECONDS", "10"))
    try:
        with socket.create_connection((host, port), timeout=timeout) as connection:
            connection.sendall(b"zINSTREAM\0")
            stream = io.BytesIO(data)
            while True:
                chunk = stream.read(8192)
                if not chunk:
                    break
                connection.sendall(struct.pack("!I", len(chunk)))
                connection.sendall(chunk)
            connection.sendall(struct.pack("!I", 0))
            response = connection.recv(4096).decode("utf-8", errors="ignore").strip()
    except OSError as error:
        if _env_flag("TRANSLATOR_CLAMAV_REQUIRED", False):
            raise VirusScanError(f"Unable to scan upload with ClamAV: {error}") from error
        return

    if response and not response.endswith("OK"):
        raise VirusScanError(f"Virus scan failed for {filename or 'uploaded file'}: {response}")


def _fernet_payload(data: bytes) -> bytes:
    fernet = _fernet()
    if fernet is None:
        return data
    return UPLOAD_MAGIC + fernet.encrypt(data)


def _unpack_payload(data: bytes) -> bytes:
    if not data.startswith(UPLOAD_MAGIC):
        return data

    fernet = _fernet()
    if fernet is None:
        return data[len(UPLOAD_MAGIC):]

    try:
        return fernet.decrypt(data[len(UPLOAD_MAGIC):])
    except InvalidToken as error:
        raise UploadValidationError("Unable to decrypt stored translator file.") from error


def store_bytes_at_rest(path: Path, data: bytes) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(_fernet_payload(data))
    return path


@contextmanager
def open_secure_storage_file(path: str | Path) -> Iterator[Path]:
    stored_path = Path(path)
    raw_data = stored_path.read_bytes()
    decoded_data = _unpack_payload(raw_data)

    if decoded_data is raw_data:
        yield stored_path
        return

    temp_dir = get_temp_work_dir()
    suffix = stored_path.suffix
    with tempfile.NamedTemporaryFile(delete=False, dir=temp_dir, suffix=suffix) as handle:
        handle.write(decoded_data)
        temp_path = Path(handle.name)

    try:
        yield temp_path
    finally:
        delete_local_file(str(temp_path))


def build_download_response(path: str | Path, *, download_name: str) -> FileResponse:
    return build_inline_file_response(path, download_name=download_name)


def _guess_content_type(download_name: str) -> str:
    suffix = Path(download_name).suffix.lower()
    if suffix in SUPPORTED_EXTENSION_MAP:
        return SUPPORTED_EXTENSION_MAP[suffix]

    guessed_type, _ = mimetypes.guess_type(download_name)
    return guessed_type or "application/octet-stream"


def build_inline_file_response(
    path: str | Path,
    *,
    download_name: str,
    content_type: str | None = None,
) -> FileResponse:
    stored_path = Path(path)
    raw_data = stored_path.read_bytes()
    decoded_data = _unpack_payload(raw_data)
    media_type = content_type or _guess_content_type(download_name)
    headers = {"Content-Disposition": f'inline; filename="{download_name}"'}

    if decoded_data is raw_data:
        return FileResponse(
            path=stored_path,
            media_type=media_type,
            headers=headers,
        )

    temp_dir = get_temp_work_dir()
    with tempfile.NamedTemporaryFile(delete=False, dir=temp_dir, suffix=Path(download_name).suffix) as handle:
        handle.write(decoded_data)
        temp_path = Path(handle.name)

    return FileResponse(
        path=temp_path,
        media_type=media_type,
        headers=headers,
        background=BackgroundTask(delete_local_file, str(temp_path)),
    )
