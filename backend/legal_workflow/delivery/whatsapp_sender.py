"""WhatsApp Cloud API sender — renders OutboundMessage into WA API payloads.

Modeled after Donna's delivery/whatsapp.py.

WA constraints encoded here:
  - Button titles truncated to 20 chars
  - CTAMessage with >3 buttons auto-degrades to ListMessage
  - Typing indicator via mark_as_read
"""
from __future__ import annotations

import asyncio
import logging

import httpx

from backend.legal_workflow.config import settings
from backend.legal_workflow.delivery.messages import (
    Button,
    CTAMessage,
    CTAUrlMessage,
    Delay,
    DocumentMessage,
    ListMessage,
    OutboundMessage,
    Section,
    TextMessage,
)

logger = logging.getLogger(__name__)

_WA_BASE = "https://graph.facebook.com/v19.0"
_BUTTON_TITLE_MAX = 20
_LIST_ROW_TITLE_MAX = 24


class WhatsAppChannel:
    """Sends OutboundMessage objects via WhatsApp Cloud API."""

    def __init__(self) -> None:
        self._phone_number_id = settings.whatsapp_phone_number_id
        self._token = settings.whatsapp_token

    @property
    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._token}"}

    @property
    def _messages_url(self) -> str:
        return f"{_WA_BASE}/{self._phone_number_id}/messages"

    # ── Public interface ───────────────────────────────────────────────────

    async def send(self, phone: str, message: OutboundMessage) -> str | None:
        payload = self._render(phone, message)
        data = await self._post(payload)
        try:
            messages = data.get("messages") or []
            if messages:
                return messages[0].get("id")
        except Exception:
            return None
        return None

    async def send_many(self, phone: str, messages: list) -> list[str]:
        """Send messages sequentially — WA doesn't guarantee order on concurrent sends."""
        wamids: list[str] = []
        for message in messages:
            if isinstance(message, Delay):
                await asyncio.sleep(message.seconds)
                continue
            wamid = await self.send(phone, message)
            if wamid:
                wamids.append(wamid)
        return wamids

    async def send_typing(self, phone: str, message_id: str | None = None) -> None:
        """Show typing indicator."""
        if not message_id:
            return
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
            "typing_indicator": {"type": "text"},
        }
        try:
            await self._post(payload)
        except Exception:
            logger.warning("send_typing failed for %s — non-fatal", phone)

    # ── Rendering ──────────────────────────────────────────────────────────

    def _render(self, phone: str, message: OutboundMessage) -> dict:
        base = {"messaging_product": "whatsapp", "to": phone}

        reply_id = getattr(message, "reply_to_message_id", None)
        if reply_id:
            base["context"] = {"message_id": reply_id}

        if isinstance(message, TextMessage):
            return {**base, "type": "text", "text": {"body": message.body}}

        if isinstance(message, CTAMessage):
            if len(message.buttons) > 3:
                degraded = ListMessage(
                    body=message.body,
                    button_label="Choose one",
                    sections=[Section(title="Options", rows=message.buttons)],
                )
                return self._render(phone, degraded)
            return {
                **base,
                "type": "interactive",
                "interactive": {
                    "type": "button",
                    "body": {"text": message.body},
                    "action": {
                        "buttons": [
                            {
                                "type": "reply",
                                "reply": {
                                    "id": btn.id,
                                    "title": btn.title[:_BUTTON_TITLE_MAX],
                                },
                            }
                            for btn in message.buttons
                        ]
                    },
                },
            }

        if isinstance(message, CTAUrlMessage):
            return {
                **base,
                "type": "interactive",
                "interactive": {
                    "type": "cta_url",
                    "body": {"text": message.body},
                    "action": {
                        "name": "cta_url",
                        "parameters": {
                            "display_text": message.display_text[:_BUTTON_TITLE_MAX],
                            "url": message.url,
                        },
                    },
                },
            }

        if isinstance(message, ListMessage):
            return {
                **base,
                "type": "interactive",
                "interactive": {
                    "type": "list",
                    "body": {"text": message.body},
                    "action": {
                        "button": message.button_label[:_BUTTON_TITLE_MAX],
                        "sections": [
                            {
                                "title": section.title,
                                "rows": [
                                    {
                                        "id": row.id,
                                        "title": row.title[:_LIST_ROW_TITLE_MAX],
                                    }
                                    for row in section.rows
                                ],
                            }
                            for section in message.sections
                        ],
                    },
                },
            }

        if isinstance(message, DocumentMessage):
            doc: dict = {"link": message.url, "filename": message.filename}
            if message.caption:
                doc["caption"] = message.caption
            return {**base, "type": "document", "document": doc}

        raise TypeError(f"Unhandled message type: {type(message)}")

    # ── HTTP ───────────────────────────────────────────────────────────────

    async def _post(self, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                self._messages_url, headers=self._headers, json=payload
            )
            if resp.status_code >= 400:
                logger.error(
                    "WhatsApp API error %s: %s", resp.status_code, resp.text[:200]
                )
                resp.raise_for_status()
            return resp.json()
