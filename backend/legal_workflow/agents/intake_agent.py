"""Intake Agent — determines what type of legal draft the user needs.

This is the first agent in the workflow. It greets the user and presents
draft type options. Once a type is selected, it transitions to the
context collection phase.
"""
from __future__ import annotations

import logging

from backend.legal_workflow.delivery.messages import (
    Button,
    CTAMessage,
    ListMessage,
    Section,
    TextMessage,
)

logger = logging.getLogger(__name__)

# ── Draft type catalog ────────────────────────────────────────────────────────
DRAFT_TYPES = {
    "legal_notice": {
        "name": "Legal Notice",
        "description": "Formal notice sent to demand action or remedy a wrong",
        "questions": [
            "who is the notice being sent to? (full name and address)",
            "what is the subject of the notice? (e.g., breach of contract, non-payment, eviction)",
            "briefly describe what happened — the key facts",
            "when did the issue arise? (approximate date)",
            "what remedy or action are you demanding?",
        ],
    },
    "petition": {
        "name": "Petition / Plaint",
        "description": "Court filing for civil suits, writ petitions, divorce, etc.",
        "questions": [
            "which court should this be filed in? (e.g., district court, high court, family court)",
            "who is the petitioner / plaintiff? (full name and address)",
            "who is the respondent / defendant? (full name and address)",
            "what is the cause of action? describe the facts in detail",
            "what relief / prayer are you seeking from the court?",
            "are there any relevant dates, amounts, or prior proceedings?",
        ],
    },
    "contract": {
        "name": "Contract / Agreement",
        "description": "Service agreement, rental agreement, NDA, MoU, partnership deed, etc.",
        "questions": [
            "what type of contract? (e.g., service agreement, rental, NDA, partnership)",
            "who are the parties? (names and addresses of all parties)",
            "what is the subject matter of the agreement?",
            "what are the key terms? (duration, payment, obligations)",
            "are there any special clauses you need? (non-compete, confidentiality, termination)",
        ],
    },
    "affidavit": {
        "name": "Affidavit",
        "description": "Sworn statement of facts for court or official purposes",
        "questions": [
            "who is the deponent (person making the affidavit)? (full name and address)",
            "what is the purpose of this affidavit? (for which proceeding or authority)",
            "what are the facts you want to state under oath?",
            "is this in relation to a pending case? if so, provide case details",
        ],
    },
    "reply_notice": {
        "name": "Reply to Legal Notice",
        "description": "Response to a legal notice received",
        "questions": [
            "who sent the original notice? (name and details)",
            "when was the notice received?",
            "what does the notice demand?",
            "what is your response / defense to their claims?",
            "do you have the original notice? you can share it as a PDF or photo",
        ],
    },
    "complaint": {
        "name": "Consumer / Police Complaint",
        "description": "Complaint to consumer forum, police, or regulatory body",
        "questions": [
            "what type of complaint? (consumer, police FIR, regulatory)",
            "who is the complaint against? (name and details)",
            "describe the incident or issue in detail",
            "when and where did it occur?",
            "what action do you want taken?",
        ],
    },
    "will": {
        "name": "Will / Testament",
        "description": "Last will and testament for property and asset distribution",
        "questions": [
            "who is the testator? (person making the will — full name, age, address)",
            "list the beneficiaries and what each should receive",
            "describe the properties/assets to be distributed",
            "who should be the executor of the will?",
            "are there any specific conditions or clauses?",
        ],
    },
    "power_of_attorney": {
        "name": "Power of Attorney",
        "description": "General or special power of attorney",
        "questions": [
            "who is granting the power? (principal — full name and address)",
            "who is receiving the power? (agent/attorney — full name and address)",
            "is this general or special power of attorney?",
            "what specific powers are being granted?",
            "what is the duration? (indefinite or time-bound)",
        ],
    },
    "other": {
        "name": "Other Legal Document",
        "description": "Any other legal document not listed above",
        "questions": [
            "what type of legal document do you need?",
            "who are the parties involved?",
            "describe the purpose and key details",
            "any specific legal provisions or sections to reference?",
        ],
    },
}


def handle_intake(message: str | None, session: dict) -> list:
    """Process the intake phase. Returns list of outbound messages."""
    text = (message or "").strip().lower()

    # First message or greeting — present options
    if not text or text in ("hi", "hello", "hey", "start", "help", "menu"):
        return _welcome_message()

    # Check if user selected a draft type
    matched_type = _match_draft_type(text)
    if matched_type:
        session["draft_type"] = matched_type
        session["workflow_state"] = "collecting_context"
        session["questions_pending"] = list(DRAFT_TYPES[matched_type]["questions"])
        session["questions_asked"] = []

        type_name = DRAFT_TYPES[matched_type]["name"]
        first_question = session["questions_pending"][0]

        return [
            TextMessage(body=f"got it — {type_name}. let me understand your case."),
            TextMessage(body=first_question),
        ]

    # Check for upload intent
    if any(w in text for w in ("upload", "review", "check my", "analyze", "risk")):
        session["workflow_state"] = "upload_review"
        return [
            TextMessage(
                body="sure, i can review your draft for legal risks. "
                     "please share the document — you can send a PDF, image, or paste the text."
            ),
        ]

    # Didn't understand — re-prompt
    return [
        TextMessage(
            body="i didn't catch that. what type of legal document do you need?"
        ),
        _draft_type_buttons(),
    ]


def _welcome_message() -> list:
    """Welcome message with draft type options."""
    return [
        TextMessage(
            body="hey! i'm draftmate's legal ai. i can help you:\n\n"
                 "📝 draft legal documents from scratch\n"
                 "📄 review your existing drafts for legal risks\n\n"
                 "what would you like to do?"
        ),
        _draft_type_buttons(),
    ]


def _draft_type_buttons() -> CTAMessage:
    """Main draft type selection as CTA buttons (top 3) + hint for more."""
    return CTAMessage(
        body="pick a document type, or type what you need:",
        buttons=[
            Button(id="legal_notice", title="Legal Notice"),
            Button(id="petition", title="Petition"),
            Button(id="contract", title="Contract"),
        ],
    )


def _match_draft_type(text: str) -> str | None:
    """Match user text to a draft type key."""
    text_lower = text.lower().strip()

    # Direct ID match (from button taps)
    if text_lower in DRAFT_TYPES:
        return text_lower

    # Fuzzy keyword matching
    keywords = {
        "legal_notice": ["notice", "legal notice", "demand notice", "cease and desist"],
        "petition": ["petition", "plaint", "suit", "writ", "divorce", "custody", "filing"],
        "contract": ["contract", "agreement", "nda", "mou", "rental", "lease", "service agreement", "partnership"],
        "affidavit": ["affidavit", "sworn", "declaration"],
        "reply_notice": ["reply", "reply to notice", "respond", "response to notice"],
        "complaint": ["complaint", "fir", "consumer", "police complaint"],
        "will": ["will", "testament", "succession"],
        "power_of_attorney": ["poa", "power of attorney", "attorney"],
        "other": ["other", "something else", "different"],
    }

    for type_key, kws in keywords.items():
        for kw in kws:
            if kw in text_lower:
                return type_key

    return None
