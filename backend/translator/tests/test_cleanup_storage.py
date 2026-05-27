from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from backend.translator.storage.cleanup import cleanup_old_storage_files


def _touch(path: Path, *, hours_old: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("payload", encoding="utf-8")
    old_time = (datetime.now(timezone.utc) - timedelta(hours=hours_old)).timestamp()
    os.utime(path, (old_time, old_time))


def test_cleanup_old_storage_files_removes_stale_files(tmp_path: Path, monkeypatch) -> None:
    original_dir = tmp_path / "original"
    translated_dir = tmp_path / "translated"
    temp_dir = tmp_path / "tmp"

    monkeypatch.setattr("backend.translator.storage.cleanup.get_original_upload_dir", lambda: original_dir)
    monkeypatch.setattr("backend.translator.storage.cleanup.get_translated_upload_dir", lambda: translated_dir)
    monkeypatch.setattr("backend.translator.storage.cleanup.get_temp_work_dir", lambda: temp_dir)

    old_file = original_dir / "old.pdf"
    new_file = translated_dir / "new.pdf"
    temp_file = temp_dir / "temp.txt"

    _touch(old_file, hours_old=30)
    _touch(new_file, hours_old=2)
    _touch(temp_file, hours_old=25)

    removed = cleanup_old_storage_files(max_age_hours=24)

    assert old_file in removed
    assert temp_file in removed
    assert not old_file.exists()
    assert not temp_file.exists()
    assert new_file.exists()
