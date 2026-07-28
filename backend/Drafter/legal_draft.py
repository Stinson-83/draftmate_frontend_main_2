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


def _generate_structured_fallback_draft(case_context: str, document_type: str = "Legal Document") -> dict:
    placeholders = ["COURT_NAME", "CITY_LOCATION", "PETITIONER_NAME", "RESPONDENT_NAME", "EXECUTION_DATE", "ADVOCATE_NAME"]
    doc_title = (document_type or "Legal Application").strip()
    
    clean_facts = str(case_context or "").replace("CASE_CONTEXT:", "").strip()
    
    content = [
        {
            "element_type": "header_block",
            "text": f"IN THE COURT OF COURT_NAME AT CITY_LOCATION\n{doc_title.upper()}"
        },
        {
            "element_type": "heading_1",
            "text": "IN THE MATTER OF:"
        },
        {
            "element_type": "paragraph",
            "text": "PETITIONER_NAME ... PETITIONER / APPLICANT"
        },
        {
            "element_type": "paragraph",
            "text": "VERSUS"
        },
        {
            "element_type": "paragraph",
            "text": "RESPONDENT_NAME ... RESPONDENT"
        },
        {
            "element_type": "heading_1",
            "text": f"APPLICATION ON BEHALF OF THE APPLICANT / PETITIONER"
        },
        {
            "element_type": "paragraph",
            "text": "MOST RESPECTFULLY SHOWETH:"
        },
        {
            "element_type": "paragraph",
            "text": "1. That the present application is being filed on behalf of the Applicant before this Honorable Court seeking appropriate legal remedies under the provisions of Indian Law."
        },
        {
            "element_type": "paragraph",
            "text": f"2. STATEMENT OF FACTS: {clean_facts if clean_facts else 'The applicant submits the facts and circumstances of the matter for consideration of this Honorable Court.'}"
        },
        {
            "element_type": "paragraph",
            "text": "3. That the Applicant undertakes to abide by all rules, conditions, and directions passed by this Honorable Court."
        },
        {
            "element_type": "heading_1",
            "text": "PRAYER"
        },
        {
            "element_type": "paragraph",
            "text": "It is, therefore, most respectfully prayed that this Honorable Court may graciously be pleased to pass an order granting the relief prayed for, in the interest of justice."
        },
        {
            "element_type": "paragraph",
            "text": "FILED BY: ADVOCATE_NAME\nDATE: EXECUTION_DATE\nPLACE: CITY_LOCATION"
        }
    ]

    return {
        "title": doc_title,
        "metadata": {
            "jurisdiction": "India",
            "placeholders_detected": placeholders
        },
        "content": content
    }


def generate_production_json_draft(case_context: str, document_type: str = "Legal Document") -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_API_KEY is not set. Generating structured legal draft.")
        return _generate_structured_fallback_draft(case_context, document_type)

    genai.configure(api_key=api_key)

    models_to_try = [
        os.getenv("DRAFTER_GEMINI_MODEL", "gemini-2.0-flash"),
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]

    user_prompt = "\n".join(
        [
            "DOCUMENT_TYPE:",
            str(document_type),
            "",
            "CASE_FACTS_MATRIX:",
            str(case_context),
        ]
    )

    response = None
    for m_name in models_to_try:
        try:
            model = genai.GenerativeModel(
                model_name=m_name,
                system_instruction=LEGAL_DRAFT_DOCX_PROMPT,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                    max_output_tokens=8192,
                ),
            )
            res = model.generate_content(user_prompt)
            if res:
                response = res
                break
        except Exception as e:
            logger.warning(f"Gemini model {m_name} failed: {e}")

    if not response:
        logger.warning("All Gemini model attempts failed. Returning structured legal draft.")
        return _generate_structured_fallback_draft(case_context, document_type)

    try:
        usage = getattr(response, "usage_metadata", None)
        if usage is not None:
            logger.info(
                "Gemini usage_metadata prompt=%s candidates=%s total=%s",
                getattr(usage, "prompt_token_count", None),
                getattr(usage, "candidates_token_count", None),
                getattr(usage, "total_token_count", None),
            )

        raw_text = _extract_response_text(response)
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.lstrip("`").strip()
        if cleaned.endswith("```"):
            cleaned = cleaned.rstrip("`").strip()

        payload = json.loads(cleaned)
        return _strict_validate_production_schema(payload)
    except Exception as e:
        logger.error(f"Gemini response parsing/validation failed: {e}. Falling back to structured draft.")
        return _generate_structured_fallback_draft(case_context, document_type)


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
