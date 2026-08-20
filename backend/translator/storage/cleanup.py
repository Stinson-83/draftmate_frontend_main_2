"""Cleanup utilities for translator storage."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

from .paths import get_original_upload_dir, get_temp_work_dir, get_translated_upload_dir


def _iter_storage_files(directory: Path):
    if not directory.exists():
        return

    for path in directory.rglob("*"):
        if path.is_file():
            yield path


def cleanup_old_storage_files(max_age_hours: int = 24) -> list[Path]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    removed: list[Path] = []

    for directory in (get_original_upload_dir(), get_translated_upload_dir(), get_temp_work_dir()):
        for path in _iter_storage_files(directory):
            modified_at = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
            if modified_at < cutoff:
                path.unlink(missing_ok=True)
                removed.append(path)

    return removed