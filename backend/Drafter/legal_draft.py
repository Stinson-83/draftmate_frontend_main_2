import json
import logging
import os
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


LEGAL_DRAFT_DOCX_PROMPT = """
You are DraftMate's production legal drafting engine for DOCX generation.

You will be given a CASE FACTS MATRIX in plain text. You must inspect it carefully and produce ONE valid raw JSON object that strictly conforms to the schema below. Output ONLY the JSON object. Do not wrap the output in markdown. Do not include commentary, explanations, or extra keys.

STRICT JSON SCHEMA (no additional keys allowed):
{
  "title": "string",
  "metadata": {
    "jurisdiction": "string",
    "placeholders_detected": ["string"]
  },
  "content": [
    {
      "element_type": "header_block" | "heading_1" | "paragraph",
      "text": "string"
    }
  ]
}

ELEMENT RULES:
1) content must be an array of paragraph blocks. Each block must contain only:
   - element_type: one of "header_block", "heading_1", "paragraph"
   - text: a plain string
2) Do not include HTML, Markdown, bullet markers, or styling markers in text. Keep it plain text.
3) Ensure the content reads like a complete professional legal document for the specified document type.

MISSING FACTS / VARIABLES POLICY (STRICT):
If any required legal fact or variable is missing or ambiguous, substitute a clean uppercase alphanumeric token using underscores only, for example:
EXECUTION_DATE
PLAINTIFF_NAME
DEFENDANT_ADDRESS
COURT_NAME
CASE_NUMBER
AMOUNT_IN_DISPUTE

The placeholder token must:
- be uppercase
- contain only A-Z, 0-9, and underscores
- not be wrapped in brackets, quotes beyond normal JSON quoting, punctuation, or markdown

PLACEHOLDER TRACKING (STRICT):
metadata.placeholders_detected must list every placeholder token you used anywhere in title or content text. Each entry must be the raw token string.

OUTPUT REQUIREMENTS:
- Return exactly one JSON object that matches the schema.
- Do not include any keys other than: title, metadata, content.
- Do not include any keys other than: jurisdiction, placeholders_detected inside metadata.
- Do not include any keys other than: element_type, text inside each content item.
"""


_ALLOWED_ELEMENT_TYPES = {"header_block", "heading_1", "paragraph"}


def _extract_response_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()
    candidates = getattr(response, "candidates", None)
    if isinstance(candidates, list) and candidates:
        try:
            parts = candidates[0].content.parts
            assembled = "".join(getattr(p, "text", "") for p in parts if getattr(p, "text", None))
            if assembled.strip():
                return assembled.strip()
        except Exception:
            pass
    raise ValueError("Gemini returned an empty response payload.")


def _strict_validate_production_schema(payload: Any) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Draft payload must be a JSON object.")

    expected_top_keys = {"title", "metadata", "content"}
    if set(payload.keys()) != expected_top_keys:
        raise ValueError(f"Draft payload must contain exactly keys {sorted(expected_top_keys)}.")

    title = payload.get("title")
    if not isinstance(title, str):
        raise ValueError("Draft payload 'title' must be a string.")

    metadata = payload.get("metadata")
    if not isinstance(metadata, dict):
        raise ValueError("Draft payload 'metadata' must be an object.")

    expected_metadata_keys = {"jurisdiction", "placeholders_detected"}
    if set(metadata.keys()) != expected_metadata_keys:
        raise ValueError(f"Draft payload 'metadata' must contain exactly keys {sorted(expected_metadata_keys)}.")

    jurisdiction = metadata.get("jurisdiction")
    if not isinstance(jurisdiction, str):
        raise ValueError("Draft payload 'metadata.jurisdiction' must be a string.")

    placeholders_detected = metadata.get("placeholders_detected")
    if not isinstance(placeholders_detected, list) or any(not isinstance(x, str) for x in placeholders_detected):
        raise ValueError("Draft payload 'metadata.placeholders_detected' must be an array of strings.")

    content = payload.get("content")
    if not isinstance(content, list) or not content:
        raise ValueError("Draft payload 'content' must be a non-empty array.")

    for i, item in enumerate(content):
        if not isinstance(item, dict):
            raise ValueError(f"Draft payload 'content[{i}]' must be an object.")
        expected_item_keys = {"element_type", "text"}
        if set(item.keys()) != expected_item_keys:
            raise ValueError(f"Draft payload 'content[{i}]' must contain exactly keys {sorted(expected_item_keys)}.")
        element_type = item.get("element_type")
        if element_type not in _ALLOWED_ELEMENT_TYPES:
            raise ValueError(
                f"Draft payload 'content[{i}].element_type' must be one of {sorted(_ALLOWED_ELEMENT_TYPES)}."
            )
        text = item.get("text")
        if not isinstance(text, str):
            raise ValueError(f"Draft payload 'content[{i}].text' must be a string.")

    for token in placeholders_detected:
        if not token or any(ch for ch in token if not (ch.isupper() or ch.isdigit() or ch == "_")):
            raise ValueError(
                "Each entry in 'metadata.placeholders_detected' must be an uppercase alphanumeric underscore token."
            )

    return payload


def generate_production_json_draft(case_context: str, document_type: str = "Legal Document") -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY is not set. Set it as an environment variable before calling the drafter service "
            "(e.g., in Docker Compose: environment: GOOGLE_API_KEY=... )."
        )

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=LEGAL_DRAFT_DOCX_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
            max_output_tokens=8192,
        ),
    )

    user_prompt = "\n".join(
        [
            "DOCUMENT_TYPE:",
            str(document_type),
            "",
            "CASE_FACTS_MATRIX:",
            str(case_context),
        ]
    )

    try:
        response = model.generate_content(user_prompt)
    except Exception as e:
        logger.exception("Gemini request failed.")
        raise RuntimeError(f"Gemini request failed: {e}") from e

    usage = getattr(response, "usage_metadata", None)
    if usage is not None:
        logger.info(
            "Gemini usage_metadata prompt=%s candidates=%s total=%s",
            getattr(usage, "prompt_token_count", None),
            getattr(usage, "candidates_token_count", None),
            getattr(usage, "total_token_count", None),
        )

    raw_text = _extract_response_text(response)
    logger.debug("Gemini raw JSON length=%s", len(raw_text))

    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.lstrip("`").strip()
    if cleaned.endswith("```"):
        cleaned = cleaned.rstrip("`").strip()

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse Gemini JSON output: %s", e)
        logger.error("Gemini raw output (first 1200 chars): %s", cleaned[:1200])
        logger.error("Gemini raw output (last 1200 chars): %s", cleaned[-1200:])
        raise ValueError(f"Gemini returned invalid JSON: {e}") from e

    try:
        return _strict_validate_production_schema(payload)
    except Exception as e:
        logger.error("Schema validation failed: %s", e)
        logger.error("Parsed payload keys=%s", list(payload.keys()) if isinstance(payload, dict) else type(payload))
        raise


def generate_legal_draft(
    case_context: str,
    legal_documents: Optional[str] = None,
    document_type: Optional[str] = None,
) -> dict:
    combined_context_parts: List[str] = []
    if case_context:
        combined_context_parts.append("CASE_CONTEXT:\n" + case_context)
    if legal_documents:
        combined_context_parts.append("REFERENCE_LEGAL_DOCUMENTS:\n" + legal_documents)
    combined_context = "\n\n".join(combined_context_parts).strip()
    return generate_production_json_draft(
        case_context=combined_context,
        document_type=document_type or "Legal Document",
    )

if __name__ == "__main__":
    t=generate_petition(case_context="My client wants to file a divorce petition")
    print(t)
