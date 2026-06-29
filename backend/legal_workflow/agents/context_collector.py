"""Context Collector Agent — gathers facts like a lawyer.

Walks through a list of questions specific to the draft type. Accepts:
  - Text answers → stored in collected_context.facts
  - PDF/document uploads → stored in collected_context.documents  
  - Image uploads → stored in collected_context.images

After each answer, asks the next question. When all questions are answered
(or user says 'done'), transitions to drafting.
"""
from __future__ import annotations

import base64
import logging

from backend.legal_workflow.delivery.messages import (
    Button,
    CTAMessage,
    TextMessage,
)
from backend.legal_workflow.ingress.payload import IngressPayload

logger = logging.getLogger(__name__)


def handle_context_collection(
    payload: IngressPayload,
    session: dict,
) -> list:
    """Process context collection. Returns list of outbound messages."""
    text = (payload.message or "").strip()
    text_lower = text.lower()

    # ── Handle "done" / "skip" / "start drafting" ─────────────────────────
    if text_lower in ("done", "skip", "start", "draft", "start drafting", "generate", "that's all", "thats all"):
        if len(session["collected_context"]["facts"]) == 0 and not session["collected_context"]["documents"]:
            return [
                TextMessage(body="i need at least some context to draft. please answer the questions or share documents."),
            ]
        session["workflow_state"] = "drafting"
        return [
            TextMessage(body="great, i have enough context. drafting your document now..."),
        ]

    # ── Handle "restart" / "new" ──────────────────────────────────────────
    if text_lower in ("restart", "new", "cancel", "start over"):
        session["workflow_state"] = "intake"
        session["draft_type"] = None
        session["collected_context"] = {"facts": [], "documents": [], "images": [], "uploaded_draft": None}
        session["questions_asked"] = []
        session["questions_pending"] = []
        return [TextMessage(body="starting over. what type of legal document do you need?")]

    # ── Store incoming context ────────────────────────────────────────────

    # Document upload
    if payload.message_type == "document" and payload.document and payload.document.file_bytes:
        doc_text = _extract_text_from_document(payload.document.file_bytes, payload.document.mime_type)
        session["collected_context"]["documents"].append({
            "filename": payload.document.filename,
            "mime_type": payload.document.mime_type,
            "extracted_text": doc_text,
            "raw_bytes_b64": base64.b64encode(payload.document.file_bytes).decode("utf-8"),
        })
        ack = f"got it — received '{payload.document.filename}'."
        if text:
            session["collected_context"]["facts"].append(text)
            ack += f" noted your comment too."
        return _ack_and_next_question(session, ack)

    # Image upload
    if payload.message_type == "image" and payload.image and payload.image.file_bytes:
        image_text = _extract_text_from_image(payload.image.file_bytes)
        session["collected_context"]["images"].append({
            "mime_type": payload.image.mime_type,
            "extracted_text": image_text,
            "raw_bytes_b64": base64.b64encode(payload.image.file_bytes).decode("utf-8"),
        })
        ack = "got the image."
        if text:
            session["collected_context"]["facts"].append(text)
        return _ack_and_next_question(session, ack)

    # Text answer
    if text:
        # Associate with the current question
        current_q = session["questions_asked"][-1] if session["questions_asked"] else "general context"
        session["collected_context"]["facts"].append({
            "question": current_q,
            "answer": text,
        })
        return _ack_and_next_question(session, None)

    return [TextMessage(body="please share the details or say 'done' when you're ready.")]


def _ack_and_next_question(session: dict, ack: str | None) -> list:
    """Acknowledge the answer and ask the next question."""
    messages = []

    if ack:
        messages.append(TextMessage(body=ack))

    pending = session.get("questions_pending", [])

    if pending:
        # Pop next question
        next_q = pending.pop(0)
        session["questions_asked"].append(next_q)
        messages.append(TextMessage(body=next_q))

        # If this was the last question, hint that they can say done
        if not pending:
            messages.append(
                CTAMessage(
                    body="that's the last key question. you can share more details or start drafting.",
                    buttons=[
                        Button(id="done", title="Start Drafting"),
                        Button(id="more", title="Add More Details"),
                    ],
                )
            )
    else:
        # All questions asked — prompt for done or more
        messages.append(
            CTAMessage(
                body="anything else to add? or should i start drafting?",
                buttons=[
                    Button(id="done", title="Start Drafting"),
                    Button(id="more", title="Add More Details"),
                ],
            )
        )

    return messages


def _extract_text_from_document(file_bytes: bytes, mime_type: str) -> str:
    """Extract text from a PDF or document. Best-effort."""
    try:
        if "pdf" in mime_type.lower():
            import io
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                pages_text = []
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        pages_text.append(t)
                return "\n".join(pages_text)[:10000]  # Cap at 10k chars
            except ImportError:
                logger.warning("PyPDF2 not installed — cannot extract PDF text")
                return "[PDF document received but text extraction unavailable]"
        return "[document received — non-PDF format]"
    except Exception as e:
        logger.exception("document text extraction failed")
        return f"[document received — extraction failed: {str(e)[:100]}]"


def _extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from an image via OCR. Best-effort."""
    try:
        import io
        try:
            from PIL import Image
            import pytesseract
            img = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(img)
            return text[:5000] if text.strip() else "[image received — no text detected]"
        except ImportError:
            logger.warning("PIL/pytesseract not installed — cannot OCR image")
            return "[image received but OCR unavailable]"
    except Exception as e:
        logger.exception("image OCR failed")
        return f"[image received — OCR failed: {str(e)[:100]}]"
