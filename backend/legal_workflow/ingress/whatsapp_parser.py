"""WhatsApp webhook adapter — parses raw WA Cloud API payloads into IngressPayloads.

Handles:
  - Message type detection: text, image, voice/audio, document
  - Media download (image, voice, document)
  - Caption extraction
  - Webhook dedup (Meta sends duplicates on retry; 60s in-memory TTL)

Modeled after Donna's ingress/whatsapp.py.
"""
from __future__ import annotations

import asyncio
import logging
import time

import httpx

from backend.legal_workflow.config import settings
from backend.legal_workflow.ingress.payload import (
    DocumentPayload,
    ImagePayload,
    IngressPayload,
    VoicePayload,
)

logger = logging.getLogger(__name__)

# ── Dedup (Meta sends duplicate webhooks on retry) ────────────────────────────
_SEEN_MSG_IDS: dict[str, float] = {}
_DEDUP_TTL = 60
_DEDUP_LOCK = asyncio.Lock()


async def parse_webhook(body: dict) -> list[IngressPayload] | None:
    """Parse a WhatsApp Cloud API webhook body into a list of IngressPayloads.

    Returns None when the body contains nothing to process (verification pings,
    status updates, bodies where every message is a duplicate or unparseable).
    """
    payloads: list[IngressPayload] = []

    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                wa_id = message.get("id")
                if not wa_id:
                    continue
                if await _is_duplicate(wa_id):
                    logger.info("whatsapp adapter: dropped duplicate %s", wa_id[:16])
                    continue
                payload = await _parse_one(message, value)
                if payload is not None:
                    payloads.append(payload)

    return payloads or None


async def _parse_one(message: dict, value: dict) -> IngressPayload | None:
    """Parse a single WA message dict into an IngressPayload."""
    sender_phone = message.get("from", "")
    if not sender_phone:
        return None

    wa_message_id = message.get("id")

    # Profile name
    contacts = value.get("contacts", [])
    profile_name = None
    if contacts and isinstance(contacts[0], dict):
        profile = contacts[0].get("profile", {})
        profile_name = profile.get("name") if isinstance(profile, dict) else None

    wa_type = message.get("type", "")

    # ── Route by message type ─────────────────────────────────────────────
    if wa_type == "text":
        text_body = message.get("text", {}).get("body", "")
        return IngressPayload(
            phone=sender_phone,
            message=text_body,
            message_type="text",
            source="whatsapp",
            platform_message_id=wa_message_id,
            platform_profile_name=profile_name,
        )

    if wa_type == "image":
        image_obj = message.get("image", {})
        media_id = image_obj.get("id")
        caption = image_obj.get("caption")
        mime_type = image_obj.get("mime_type", "image/jpeg")
        image_bytes = await _download_media(media_id) if media_id else None
        return IngressPayload(
            phone=sender_phone,
            message=caption,
            message_type="image",
            image=ImagePayload(file_bytes=image_bytes, mime_type=mime_type) if image_bytes else None,
            source="whatsapp",
            platform_message_id=wa_message_id,
            platform_profile_name=profile_name,
        )

    if wa_type in ("audio", "voice"):
        audio_obj = message.get("audio") or message.get("voice") or {}
        media_id = audio_obj.get("id")
        mime_type = audio_obj.get("mime_type", "audio/ogg")
        voice_bytes = await _download_media(media_id) if media_id else None
        return IngressPayload(
            phone=sender_phone,
            message=None,
            message_type="voice",
            voice=VoicePayload(file_bytes=voice_bytes, mime_type=mime_type) if voice_bytes else None,
            source="whatsapp",
            platform_message_id=wa_message_id,
            platform_profile_name=profile_name,
        )

    if wa_type == "document":
        doc_obj = message.get("document", {})
        media_id = doc_obj.get("id")
        caption = doc_obj.get("caption")
        filename = doc_obj.get("filename", "document")
        mime_type = doc_obj.get("mime_type", "application/octet-stream")
        doc_bytes = await _download_media(media_id) if media_id else None
        return IngressPayload(
            phone=sender_phone,
            message=caption,
            message_type="document",
            document=DocumentPayload(
                file_bytes=doc_bytes, filename=filename, mime_type=mime_type,
            ) if doc_bytes else None,
            source="whatsapp",
            platform_message_id=wa_message_id,
            platform_profile_name=profile_name,
        )

    if wa_type == "interactive":
        interactive = message.get("interactive", {})
        reply = interactive.get("button_reply") or interactive.get("list_reply") or {}
        text = reply.get("title", "")
        return IngressPayload(
            phone=sender_phone,
            message=text,
            message_type="text",
            source="whatsapp",
            platform_message_id=wa_message_id,
            platform_profile_name=profile_name,
        )

    # Unknown type — normalize as text
    logger.warning("whatsapp adapter: unhandled message type %s — passing through", wa_type)
    return IngressPayload(
        phone=sender_phone,
        message=f"[sent a {wa_type} message]",
        message_type="text",
        source="whatsapp",
        platform_message_id=wa_message_id,
        platform_profile_name=profile_name,
    )


# ── Media download ────────────────────────────────────────────────────────────

async def _download_media(media_id: str) -> bytes | None:
    """Download media from WhatsApp Cloud API. Returns raw bytes."""
    headers = {"Authorization": f"Bearer {settings.whatsapp_token}"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            url_resp = await client.get(
                f"https://graph.facebook.com/v19.0/{media_id}", headers=headers,
            )
            url_resp.raise_for_status()
            media_url = url_resp.json()["url"]
            dl = await client.get(media_url, headers=headers)
            dl.raise_for_status()
            return dl.content
    except Exception:
        logger.exception("whatsapp adapter: media download failed for %s", media_id[:8])
        return None


# ── Dedup ─────────────────────────────────────────────────────────────────────

async def _is_duplicate(wa_message_id: str | None) -> bool:
    if not wa_message_id:
        return False
    async with _DEDUP_LOCK:
        now = time.monotonic()
        expired = [k for k, ts in _SEEN_MSG_IDS.items() if now - ts > _DEDUP_TTL]
        for k in expired:
            del _SEEN_MSG_IDS[k]
        if wa_message_id in _SEEN_MSG_IDS:
            return True
        _SEEN_MSG_IDS[wa_message_id] = now
        return False
