"""In-memory session store for the legal workflow.

Each phone number (WhatsApp) or user_id (web) gets a session dict tracking:
  - workflow_state: current phase of the legal workflow
  - draft_type: what kind of document the user wants
  - collected_context: facts, documents, images gathered so far
  - questions_asked: which questions the context collector has asked
  - generated_draft: the HTML draft output
  - review_result: legal risk analysis output
  - draft_id: unique identifier for the draft (for sharing links)

For production, swap this for PostgreSQL or Redis.
"""
from __future__ import annotations

import logging
import time
import uuid
from typing import Any

logger = logging.getLogger(__name__)

# ── In-memory session store ───────────────────────────────────────────────────
_SESSIONS: dict[str, dict[str, Any]] = {}
_SESSION_TTL = 3600 * 24  # 24 hours


def _new_session(session_key: str, profile_name: str | None = None) -> dict[str, Any]:
    """Create a fresh workflow session."""
    return {
        "session_key": session_key,
        "profile_name": profile_name,
        "workflow_state": "intake",
        "draft_type": None,
        "collected_context": {
            "facts": [],
            "documents": [],
            "images": [],
            "uploaded_draft": None,  # For upload-for-review path
        },
        "questions_asked": [],
        "questions_pending": [],
        "generated_draft": None,
        "draft_html": None,
        "review_result": None,
        "draft_id": None,
        "created_at": time.time(),
        "updated_at": time.time(),
    }


def get_session(session_key: str) -> dict[str, Any] | None:
    """Get session by key (phone number or user_id). Returns None if expired/missing."""
    session = _SESSIONS.get(session_key)
    if session is None:
        return None
    if time.time() - session["created_at"] > _SESSION_TTL:
        del _SESSIONS[session_key]
        return None
    return session


def get_or_create_session(
    session_key: str,
    profile_name: str | None = None,
) -> dict[str, Any]:
    """Get existing session or create new one."""
    session = get_session(session_key)
    if session is None:
        session = _new_session(session_key, profile_name)
        _SESSIONS[session_key] = session
        logger.info("session: created new session for %s", session_key[:8])
    return session


def update_session(session_key: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update session fields. Creates if missing."""
    session = get_or_create_session(session_key)
    session.update(updates)
    session["updated_at"] = time.time()
    return session


def reset_session(session_key: str) -> dict[str, Any]:
    """Reset a session to fresh state."""
    profile_name = None
    if session_key in _SESSIONS:
        profile_name = _SESSIONS[session_key].get("profile_name")
    session = _new_session(session_key, profile_name)
    _SESSIONS[session_key] = session
    return session


def generate_draft_id() -> str:
    """Generate a unique draft ID for sharing."""
    return str(uuid.uuid4())[:12]


# ── Draft storage (for sharing via link) ──────────────────────────────────────
_DRAFTS: dict[str, dict[str, Any]] = {}


def store_draft(draft_id: str, html_content: str, metadata: dict | None = None) -> None:
    """Store a generated draft for retrieval via link."""
    _DRAFTS[draft_id] = {
        "html_content": html_content,
        "metadata": metadata or {},
        "created_at": time.time(),
    }


def get_draft(draft_id: str) -> dict[str, Any] | None:
    """Retrieve a stored draft by ID."""
    return _DRAFTS.get(draft_id)
