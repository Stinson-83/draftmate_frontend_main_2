"""Uvicorn entrypoint for the translator service."""

from pathlib import Path
import sys

current_dir = Path(__file__).resolve().parent
repo_root = current_dir.parent.parent
if str(repo_root) not in sys.path:
    sys.path.append(str(repo_root))

from backend.translator.api.app import app


__all__ = ["app"]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.translator.app:app", host="0.0.0.0", port=8012, reload=True)
