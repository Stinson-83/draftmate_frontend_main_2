"""Abstract outbound message types — what the workflow produces.

Channel-agnostic. delivery/whatsapp_sender.py translates these into
WA Cloud API payloads.

Modeled after Donna's delivery/messages.py.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Union


@dataclass
class TextMessage:
    body: str
    reply_to_message_id: str | None = None


@dataclass
class Button:
    id: str      # payload echoed back when tapped
    title: str   # display label — WA enforces max 20 chars


@dataclass
class CTAMessage:
    """Text with reply buttons. 1-3 buttons render as WA button message."""
    body: str
    buttons: list[Button]
    reply_to_message_id: str | None = None


@dataclass
class CTAUrlMessage:
    """Text with a single URL button. Tapping opens the URL."""
    body: str
    display_text: str
    url: str
    reply_to_message_id: str | None = None


@dataclass
class Section:
    title: str
    rows: list[Button]


@dataclass
class ListMessage:
    """Scrollable list of options — WA supports up to 10 rows."""
    body: str
    button_label: str
    sections: list[Section]


@dataclass
class DocumentMessage:
    url: str
    filename: str
    caption: str = ""
    reply_to_message_id: str | None = None


@dataclass
class Delay:
    """Marker — tells delivery layer to pause before next message."""
    seconds: float


OutboundMessage = Union[
    TextMessage,
    CTAMessage,
    CTAUrlMessage,
    ListMessage,
    DocumentMessage,
]
