"""Workflow Engine — orchestrates the legal drafting pipeline.

Modeled after Donna's brain.py: takes an inbound payload + session, routes to
the correct agent based on workflow_state, and returns outbound messages.

State machine:
    intake → collecting_context → drafting → reviewing → final → complete
                                    ↑                       ↓
                              upload_review ────────────→ final
"""
from __future__ import annotations

import logging
from typing import Any

from backend.legal_workflow.agents.intake_agent import handle_intake
from backend.legal_workflow.agents.context_collector import handle_context_collection
from backend.legal_workflow.agents.drafter_agent import generate_draft
from backend.legal_workflow.agents.legal_reviewer import (
    format_review_for_chat,
    review_draft,
)
from backend.legal_workflow.config import settings
from backend.legal_workflow.delivery.messages import (
    Button,
    CTAMessage,
    CTAUrlMessage,
    Delay,
    DocumentMessage,
    TextMessage,
)
from backend.legal_workflow.ingress.payload import IngressPayload
from backend.legal_workflow.session_store import (
    generate_draft_id,
    get_or_create_session,
    reset_session,
    store_draft,
    update_session,
)

logger = logging.getLogger(__name__)


async def process_turn(payload: IngressPayload) -> list:
    """Process one inbound turn through the workflow.
    
    Returns a list of OutboundMessage objects to send back.
    """
    # Session key: phone for WhatsApp, user_id for web
    session_key = payload.phone or payload.user_id or "anonymous"
    session = get_or_create_session(session_key, payload.platform_profile_name)

    state = session["workflow_state"]
    text = (payload.message or "").strip().lower()

    logger.info(
        "workflow: turn for %s | state=%s | type=%s | text=%s",
        session_key[:8], state, payload.message_type, text[:50] if text else "(none)",
    )

    # ── Global commands (work in any state) ───────────────────────────────
    if text in ("restart", "reset", "start over", "new"):
        reset_session(session_key)
        return handle_intake(None, get_or_create_session(session_key))

    if text in ("status", "where am i"):
        return [TextMessage(body=f"you're in the '{state}' phase.")]

    # ── Route by state ────────────────────────────────────────────────────
    try:
        if state == "intake":
            return handle_intake(payload.message, session)

        elif state == "collecting_context":
            messages = handle_context_collection(payload, session)
            if session.get("workflow_state") == "drafting":
                draft_msgs = await _handle_drafting(session, session_key)
                messages.extend(draft_msgs)
            return messages

        elif state == "drafting":
            return await _handle_drafting(session, session_key)

        elif state == "upload_review":
            return await _handle_upload_review(payload, session, session_key)

        elif state == "reviewing":
            return await _handle_reviewing(session, session_key, text)

        elif state == "final":
            return _handle_final(session, session_key, text)

        elif state == "complete":
            # Start fresh on new message after completion
            reset_session(session_key)
            return handle_intake(payload.message, get_or_create_session(session_key))

        else:
            logger.warning("workflow: unknown state '%s', resetting", state)
            reset_session(session_key)
            return handle_intake(None, get_or_create_session(session_key))

    except Exception as e:
        logger.exception("workflow: error in state '%s' for %s", state, session_key[:8])
        return [
            TextMessage(body=f"something went wrong: {str(e)[:100]}. let's try again."),
            TextMessage(body="type 'restart' to start over."),
        ]


async def _handle_drafting(session: dict, session_key: str) -> list:
    """Generate the legal draft from collected context."""
    messages = []

    try:
        html_content = generate_draft(session)

        # Generate a draft ID for sharing
        draft_id = generate_draft_id()
        draft_type = session.get("draft_type", "other")

        # Store draft
        from backend.legal_workflow.agents.intake_agent import DRAFT_TYPES
        type_name = DRAFT_TYPES.get(draft_type, {}).get("name", "Legal Document")

        store_draft(draft_id, html_content, {
            "type": draft_type,
            "type_name": type_name,
            "session_key": session_key,
        })

        update_session(session_key, {
            "generated_draft": html_content,
            "draft_html": html_content,
            "draft_id": draft_id,
            "workflow_state": "reviewing",
        })

        # Build editor URL
        editor_url = f"{settings.frontend_url}/dashboard/editor?draft={draft_id}"

        messages.append(TextMessage(body="your draft is ready! 📝"))
        messages.append(Delay(seconds=1.0))
        messages.append(
            CTAUrlMessage(
                body=f"here's your {type_name}. you can view and edit it in the editor:",
                display_text="Open in Editor",
                url=editor_url,
            )
        )
        messages.append(Delay(seconds=0.5))
        messages.append(TextMessage(body="running a legal risk check now..."))

        # Auto-run review
        review_messages = await _run_review(session, session_key)
        messages.extend(review_messages)

    except Exception as e:
        logger.exception("drafting failed")
        update_session(session_key, {"workflow_state": "collecting_context"})
        messages.append(
            TextMessage(body=f"drafting failed: {str(e)[:100]}. let me try again — can you add more details?")
        )

    return messages


async def _handle_upload_review(
    payload: IngressPayload,
    session: dict,
    session_key: str,
) -> list:
    """Handle upload of user's own draft for risk analysis."""
    messages = []

    # Accept document upload
    if payload.message_type == "document" and payload.document and payload.document.file_bytes:
        import base64
        from backend.legal_workflow.agents.context_collector import _extract_text_from_document

        doc_text = _extract_text_from_document(
            payload.document.file_bytes, payload.document.mime_type
        )
        session["collected_context"]["uploaded_draft"] = doc_text

        messages.append(TextMessage(body=f"received '{payload.document.filename}'. analyzing for legal risks..."))
        messages.append(Delay(seconds=1.0))

        # Run review on uploaded content
        review_result = review_draft(doc_text)
        update_session(session_key, {
            "review_result": review_result,
            "workflow_state": "final",
        })

        review_text = format_review_for_chat(review_result)
        messages.append(TextMessage(body=review_text))
        messages.append(
            CTAMessage(
                body="what would you like to do?",
                buttons=[
                    Button(id="draft_fixed", title="Draft a Fixed Version"),
                    Button(id="restart", title="New Draft"),
                ],
            )
        )
        return messages

    # Accept image upload (photo of document)
    if payload.message_type == "image" and payload.image and payload.image.file_bytes:
        from backend.legal_workflow.agents.context_collector import _extract_text_from_image

        image_text = _extract_text_from_image(payload.image.file_bytes)
        session["collected_context"]["uploaded_draft"] = image_text

        messages.append(TextMessage(body="got the image. extracting text and analyzing..."))
        messages.append(Delay(seconds=1.0))

        review_result = review_draft(image_text)
        update_session(session_key, {
            "review_result": review_result,
            "workflow_state": "final",
        })

        review_text = format_review_for_chat(review_result)
        messages.append(TextMessage(body=review_text))
        messages.append(
            CTAMessage(
                body="what would you like to do?",
                buttons=[
                    Button(id="draft_fixed", title="Draft a Fixed Version"),
                    Button(id="restart", title="New Draft"),
                ],
            )
        )
        return messages

    # Accept pasted text
    text = (payload.message or "").strip()
    if text and len(text) > 50:  # Assume long text is a draft
        session["collected_context"]["uploaded_draft"] = text
        messages.append(TextMessage(body="got it. analyzing your draft for legal risks..."))
        messages.append(Delay(seconds=1.0))

        review_result = review_draft(text)
        update_session(session_key, {
            "review_result": review_result,
            "workflow_state": "final",
        })

        review_text = format_review_for_chat(review_result)
        messages.append(TextMessage(body=review_text))
        messages.append(
            CTAMessage(
                body="what would you like to do?",
                buttons=[
                    Button(id="draft_fixed", title="Draft a Fixed Version"),
                    Button(id="restart", title="New Draft"),
                ],
            )
        )
        return messages

    return [
        TextMessage(
            body="please share the document you'd like reviewed — "
                 "you can send a PDF, photo, or paste the text directly."
        )
    ]


async def _run_review(session: dict, session_key: str) -> list:
    """Run legal risk review on the generated draft."""
    messages = []

    html_content = session.get("generated_draft", "")
    if not html_content:
        return [TextMessage(body="no draft to review.")]

    from backend.legal_workflow.agents.intake_agent import DRAFT_TYPES
    draft_type = session.get("draft_type", "other")
    type_name = DRAFT_TYPES.get(draft_type, {}).get("name", "Legal Document")

    review_result = review_draft(html_content, type_name)
    update_session(session_key, {
        "review_result": review_result,
        "workflow_state": "final",
    })

    review_text = format_review_for_chat(review_result)
    messages.append(Delay(seconds=1.5))
    messages.append(TextMessage(body=review_text))

    draft_id = session.get("draft_id")
    editor_url = f"{settings.frontend_url}/dashboard/editor?draft={draft_id}" if draft_id else None

    cta_buttons = [
        Button(id="apply_fixes", title="Apply Suggestions"),
        Button(id="download_pdf", title="Download PDF"),
    ]

    body = "what would you like to do with the draft?"

    messages.append(CTAMessage(body=body, buttons=cta_buttons))

    return messages


async def _handle_reviewing(session: dict, session_key: str, text: str) -> list:
    """Handle post-review actions."""
    if text in ("apply fixes", "apply_fixes", "apply suggestions", "fix", "update"):
        # Re-draft with review suggestions incorporated
        review = session.get("review_result", {})
        issues = review.get("issues", [])
        suggestions = review.get("suggested_additions", [])

        if issues or suggestions:
            fix_context = "\n".join(
                [f"- Fix: {i['recommendation']}" for i in issues if 'recommendation' in i]
                + [f"- Add: {s}" for s in suggestions]
            )
            session["collected_context"]["facts"].append({
                "question": "Legal reviewer suggestions",
                "answer": fix_context,
            })

        update_session(session_key, {"workflow_state": "drafting"})
        return await _handle_drafting(session, session_key)

    if text in ("download pdf", "download_pdf", "pdf", "download"):
        draft_id = session.get("draft_id")
        if draft_id:
            pdf_url = f"{settings.frontend_url}/api/workflow/draft/{draft_id}/pdf"
            return [
                DocumentMessage(
                    url=pdf_url,
                    filename=f"draft_{draft_id}.pdf",
                    caption="here's your draft as PDF",
                ),
            ]
        return [TextMessage(body="no draft available for download.")]

    # Default — show final options
    return _handle_final(session, session_key, text)


def _handle_final(session: dict, session_key: str, text: str) -> list:
    """Handle the final state — completion options."""
    text_lower = text.lower()

    if text_lower in ("draft_fixed", "draft a fixed version", "fix it", "redraft"):
        update_session(session_key, {"workflow_state": "drafting"})
        return [TextMessage(body="redrafting with improvements...")]

    if text_lower in ("new", "restart", "another", "new draft"):
        reset_session(session_key)
        return handle_intake(None, get_or_create_session(session_key))

    if text_lower in ("done", "thanks", "thank you", "ok", "okay"):
        update_session(session_key, {"workflow_state": "complete"})
        return [
            TextMessage(body="glad i could help! come back anytime you need a legal draft. 📝")
        ]

    # Default — show options
    draft_id = session.get("draft_id")
    messages = []

    messages.append(
        CTAMessage(
            body="what would you like to do?",
            buttons=[
                Button(id="restart", title="New Draft"),
                Button(id="done", title="I'm Done"),
            ],
        )
    )
    return messages
