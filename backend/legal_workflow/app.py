"""FastAPI entrypoint for Legal Workflow.

Exposes:
  - /webhook (GET/POST) for WhatsApp Cloud API
  - /api/workflow/turn (POST) for web chat interactions
  - /api/workflow/draft/{draft_id} (GET) to retrieve generated HTML draft
  - /api/workflow/draft/{draft_id}/pdf (GET) to retrieve draft as PDF
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.legal_workflow.config import settings
from backend.legal_workflow.delivery.whatsapp_sender import WhatsAppChannel
from backend.legal_workflow.ingress.payload import IngressPayload
from backend.legal_workflow.ingress.whatsapp_parser import parse_webhook
from backend.legal_workflow.pdf_generator import html_to_pdf
from backend.legal_workflow.session_store import get_draft
from backend.legal_workflow.workflow_engine import process_turn

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="DraftMate Legal Workflow")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Webhook: WhatsApp Cloud API ───────────────────────────────────────────────

@app.get("/webhook")
async def verify_webhook(request: Request):
    """WhatsApp Cloud API verification challenge."""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == settings.whatsapp_verify_token:
            logger.info("WhatsApp webhook verified.")
            return Response(content=challenge, media_type="text/plain")
        raise HTTPException(status_code=403, detail="Verification failed")
    raise HTTPException(status_code=400, detail="Missing parameters")


@app.post("/webhook")
async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive WhatsApp webhook, parse payloads, and dispatch to workflow."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    payloads = await parse_webhook(body)
    
    if not payloads:
        # Standard WhatsApp ACK
        return {"status": "ok"}

    # Process all payloads in the background so WhatsApp gets an immediate 200 OK
    for payload in payloads:
        background_tasks.add_task(_run_workflow_turn, payload)

    return {"status": "ok", "dispatched": len(payloads)}


async def _run_workflow_turn(payload: IngressPayload) -> None:
    """Run one turn of the workflow and send replies via WhatsApp."""
    channel = WhatsAppChannel()
    
    # Typing indicator
    if payload.platform_message_id:
        await channel.send_typing(payload.phone, payload.platform_message_id)
        
    try:
        messages = await process_turn(payload)
        if messages:
            await channel.send_many(payload.phone, messages)
    except Exception:
        logger.exception("Failed to process turn or send reply")


# ── Web API: Frontend Chat Integration ────────────────────────────────────────

class TurnRequest(BaseModel):
    user_id: str
    message: str | None = None
    message_type: str = "text"
    document_base64: str | None = None
    document_filename: str | None = None
    document_mime_type: str | None = None
    image_base64: str | None = None
    image_mime_type: str | None = None

class TurnResponse(BaseModel):
    messages: list[dict[str, Any]]

@app.post("/api/workflow/turn", response_model=TurnResponse)
async def web_turn(request: TurnRequest):
    """Process a turn from the web chat UI."""
    import base64
    from backend.legal_workflow.ingress.payload import DocumentPayload, ImagePayload
    
    doc = None
    if request.document_base64:
        try:
            doc_bytes = base64.b64decode(request.document_base64)
            doc = DocumentPayload(
                file_bytes=doc_bytes,
                filename=request.document_filename or "document",
                mime_type=request.document_mime_type or "application/octet-stream",
            )
        except Exception:
            logger.exception("Failed to decode document base64")

    img = None
    if request.image_base64:
        try:
            img_bytes = base64.b64decode(request.image_base64)
            img = ImagePayload(
                file_bytes=img_bytes,
                mime_type=request.image_mime_type or "image/jpeg",
            )
        except Exception:
            logger.exception("Failed to decode image base64")

    payload = IngressPayload(
        phone="",  # Web uses user_id
        user_id=request.user_id,
        message=request.message,
        message_type=request.message_type,
        document=doc,
        image=img,
        source="web",
    )

    try:
        messages = await process_turn(payload)
        
        # Serialize outbound messages for the frontend
        serialized = []
        for msg in messages:
            from backend.legal_workflow.delivery.messages import (
                TextMessage, CTAMessage, CTAUrlMessage, ListMessage, DocumentMessage, Delay
            )
            
            if isinstance(msg, TextMessage):
                serialized.append({"type": "text", "body": msg.body})
            elif isinstance(msg, CTAMessage):
                serialized.append({
                    "type": "cta",
                    "body": msg.body,
                    "buttons": [{"id": b.id, "title": b.title} for b in msg.buttons],
                })
            elif isinstance(msg, CTAUrlMessage):
                serialized.append({
                    "type": "cta_url",
                    "body": msg.body,
                    "display_text": msg.display_text,
                    "url": msg.url,
                })
            elif isinstance(msg, ListMessage):
                serialized.append({
                    "type": "list",
                    "body": msg.body,
                    "button_label": msg.button_label,
                    "sections": [
                        {"title": s.title, "rows": [{"id": r.id, "title": r.title} for r in s.rows]}
                        for s in msg.sections
                    ],
                })
            elif isinstance(msg, DocumentMessage):
                serialized.append({
                    "type": "document",
                    "url": msg.url,
                    "filename": msg.filename,
                    "caption": msg.caption,
                })
            elif isinstance(msg, Delay):
                serialized.append({"type": "delay", "seconds": msg.seconds})
                
        return TurnResponse(messages=serialized)
        
    except Exception as e:
        logger.exception("Web turn failed")
        raise HTTPException(status_code=500, detail=str(e))


# ── Web API: Draft Retrieval ──────────────────────────────────────────────────

@app.get("/api/workflow/draft/{draft_id}")
async def get_draft_content(draft_id: str):
    """Retrieve the generated draft HTML for the editor."""
    draft = get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    return {
        "html_content": draft["html_content"],
        "metadata": draft["metadata"],
        "created_at": draft["created_at"],
    }


@app.get("/api/workflow/draft/{draft_id}/pdf")
async def get_draft_pdf(draft_id: str):
    """Retrieve the generated draft as a PDF file."""
    draft = get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    try:
        pdf_bytes = html_to_pdf(draft["html_content"])
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="draft_{draft_id}.pdf"'
            }
        )
    except Exception as e:
        logger.exception("Failed to generate PDF")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")


# ── Application Runner ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.legal_workflow.app:app", host="0.0.0.0", port=8010, reload=True)
