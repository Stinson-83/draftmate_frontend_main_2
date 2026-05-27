"""Storage path helpers for translator uploads."""

from pathlib import Path
from uuid import uuid4


def get_original_upload_path(filename: str | None) -> Path:
    base_dir = Path(__file__).resolve().parent
    original_dir = base_dir / "original"
    original_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(filename or "document").name
    return original_dir / f"{uuid4()}_{safe_name}"
