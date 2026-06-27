"""Storage path helpers for translator uploads."""

from pathlib import Path
from uuid import uuid4


def get_original_upload_path(filename: str | None) -> Path:
    original_dir = get_original_upload_dir()
    original_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(filename or "document").name
    return original_dir / f"{uuid4()}_{safe_name}"


def get_translated_upload_path(filename: str | None) -> Path:
    translated_dir = get_translated_upload_dir()
    translated_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(filename or "document").name
    return translated_dir / f"{uuid4()}_{safe_name}"


def get_storage_root() -> Path:
    return Path(__file__).resolve().parent


def get_original_upload_dir() -> Path:
    return get_storage_root() / "original"


def get_translated_upload_dir() -> Path:
    return get_storage_root() / "translated"


def get_temp_work_dir() -> Path:
    temp_dir = get_storage_root() / "tmp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir


def delete_local_file(file_path: str | None) -> None:
    if not file_path:
        return

    path = Path(file_path)
    if path.exists():
        path.unlink()
