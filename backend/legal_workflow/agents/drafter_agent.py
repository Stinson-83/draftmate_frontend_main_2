"""Drafter Agent — generates the legal document using Gemini.

Takes the collected context (facts, documents, images) and produces a
complete HTML legal draft with proper formatting and placeholders for
missing information. Uses the same Gemini model and system prompt
approach as the existing Drafter service.
"""
from __future__ import annotations

import logging
import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── System prompt (reused from existing legal_draft.py, adapted) ──────────────
DRAFTER_SYSTEM_PROMPT = """You are an expert legal drafting assistant with extensive knowledge of Indian legal terminology, document structures, and professional legal writing conventions.

## YOUR TASK:
Generate a complete, professionally formatted legal draft based on the provided context.

## CRITICAL RULES:
1. Use all provided facts, documents, and context to create the draft
2. For ANY missing information, insert placeholders: [description of missing info]
3. Follow proper legal document structure (header, parties, body, prayer, signature)
4. Use formal legal language, proper numbering, and section headers
5. Include applicable legal provisions, sections, and acts
6. Output ONLY clean HTML — no markdown, no code fences

## HTML FORMAT:
- Wrap paragraphs in <p> tags
- Use <b>/<strong> for party names, key terms, section headers
- Use style="text-align: center;" for document titles
- Use <i>/<em> for Latin terms
- Use <u> for conventional underlines
- Keep inline styles only (no CSS classes)
- NO <ul>/<ol>/<li> — use <p> with manual numbering
- Break text into short paragraphs (max 8-10 lines each)
- Ensure proper closing with signature blocks

## PLACEHOLDER FORMAT:
[Full legal name of the Plaintiff]
[Complete residential address of the Defendant]
[Date of incident]
[Exact amount in dispute]
[Case Number assigned by the Court]

## OUTPUT:
Produce the complete legal draft as valid HTML. Output ONLY the HTML."""


def generate_draft(session: dict) -> str:
    """Generate a legal draft from the session's collected context.
    
    Returns HTML string of the generated draft.
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("No Google/Gemini API key configured")

    genai.configure(api_key=api_key)

    draft_type = session.get("draft_type", "other")
    context = session.get("collected_context", {})

    # Build the user prompt from collected context
    user_prompt = _build_prompt(draft_type, context)

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=DRAFTER_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            max_output_tokens=8192,
            temperature=0.7,
        ),
    )

    try:
        response = model.generate_content(user_prompt)
        if response.text:
            html = response.text.strip()
            # Clean markdown fences if present
            if html.startswith("```html"):
                html = html[7:]
            if html.startswith("```"):
                html = html[3:]
            if html.endswith("```"):
                html = html[:-3]
            return html.strip()
        raise Exception("Empty response from model")
    except Exception as e:
        logger.exception("draft generation failed")
        raise Exception(f"Failed to generate draft: {str(e)}")


def _build_prompt(draft_type: str, context: dict) -> str:
    """Build the user prompt from collected context."""
    from backend.legal_workflow.agents.intake_agent import DRAFT_TYPES

    type_info = DRAFT_TYPES.get(draft_type, DRAFT_TYPES["other"])
    parts = []

    parts.append(f"## DOCUMENT TYPE: {type_info['name']}\n")

    # Facts (Q&A pairs)
    facts = context.get("facts", [])
    if facts:
        parts.append("## CASE CONTEXT (collected from client):\n")
        for i, fact in enumerate(facts, 1):
            if isinstance(fact, dict):
                parts.append(f"Q: {fact.get('question', 'General')}")
                parts.append(f"A: {fact.get('answer', '')}\n")
            else:
                parts.append(f"{i}. {fact}\n")

    # Documents
    docs = context.get("documents", [])
    if docs:
        parts.append("## REFERENCE DOCUMENTS:\n")
        for doc in docs:
            parts.append(f"### Document: {doc.get('filename', 'Uploaded document')}")
            extracted = doc.get("extracted_text", "")
            if extracted:
                parts.append(f"Content:\n{extracted[:5000]}\n")

    # Images
    images = context.get("images", [])
    if images:
        parts.append("## IMAGES PROVIDED:\n")
        for img in images:
            extracted = img.get("extracted_text", "")
            if extracted:
                parts.append(f"Image text content:\n{extracted[:3000]}\n")

    parts.append(
        "\n## INSTRUCTION:\n"
        "Based on ALL the context above, generate a complete, professionally formatted "
        f"{type_info['name']}. Use placeholders [description] for any missing information. "
        "Output ONLY the HTML content."
    )

    return "\n".join(parts)
