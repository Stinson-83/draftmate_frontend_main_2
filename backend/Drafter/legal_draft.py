import json
import logging
import os
import re
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


ENRICH_PROMPT_SYSTEM_INSTRUCTION = """
You are an expert Legal Counsel and Master Draftsman.
Your task is to enrich and enhance the raw input prompt or case facts provided by the user.
Transform it into a comprehensive, professional, and detailed drafting instruction set.

GUIDELINES:
1. Maintain ALL core facts, party names, locations, dates, jurisdictions, and specific requests. Do not hallucinate or omit user facts.
2. Expand the prompt to cover standard legal objectives, structural requirements, boilerplate clauses, risk allocations, and drafting nuances for this specific category of document.
3. Output ONLY the enriched prompt. Do not wrap in markdown or add conversational responses.
"""


def enrich_user_prompt(raw_prompt: str) -> str:
    """
    Uses Gemini to enrich and structure the user's raw prompt into a professional,
    high-quality legal drafting instruction set while preserving all original facts.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_API_KEY is not set. Skipping prompt enrichment.")
        return raw_prompt

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=ENRICH_PROMPT_SYSTEM_INSTRUCTION,
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                max_output_tokens=2048,
            ),
        )
        response = model.generate_content(raw_prompt)
        enriched = _extract_response_text(response)
        if enriched.strip():
            logger.info("Prompt enriched successfully.")
            return enriched.strip()
    except Exception as e:
        logger.error(f"Failed to enrich user prompt: {e}")
    
def _fallback_parse_gemini_legal_json(cleaned_text: str) -> dict:
    title_match = re.search(r'"title"\s*:\s*"(.*?)"\s*,\s*"metadata"', cleaned_text, re.DOTALL)
    title = title_match.group(1).strip() if title_match else "Legal Document"

    jur_match = re.search(r'"jurisdiction"\s*:\s*"(.*?)"', cleaned_text)
    jurisdiction = jur_match.group(1).strip() if jur_match else "India"

    placeholders = []
    ph_match = re.search(r'"placeholders_detected"\s*:\s*\[(.*?)\]', cleaned_text, re.DOTALL)
    if ph_match:
        placeholders = re.findall(r'"([A-Z0-9_]+)"', ph_match.group(1))

    content_blocks = []
    pattern = re.compile(r'\{\s*"element_type"\s*:\s*"(header_block|heading_1|paragraph)"\s*,\s*"text"\s*:\s*"(.*?)"\s*\}', re.DOTALL)
    for elem_type, text_val in pattern.findall(cleaned_text):
        clean_p = text_val.replace('\\"', '"').replace('\\n', '\n').strip()
        if clean_p:
            content_blocks.append({"element_type": elem_type, "text": clean_p})

    if not content_blocks:
        items = re.findall(r'"element_type"\s*:\s*"(header_block|heading_1|paragraph)".*?"text"\s*:\s*"(.*?)"\s*(?=\}\s*,\s*\{|\}\s*\]|\}\s*\}$)', cleaned_text, re.DOTALL)
        for elem_type, text_val in items:
            clean_p = text_val.replace('\\"', '"').replace('\\n', '\n').strip()
            if clean_p:
                content_blocks.append({"element_type": elem_type, "text": clean_p})

    if not content_blocks:
        raw_clean = re.sub(r'[\{\}\[\]"]', '', cleaned_text).strip()
        content_blocks = [{"element_type": "paragraph", "text": raw_clean[:4000]}]

    return {
        "title": title,
        "metadata": {
            "jurisdiction": jurisdiction,
            "placeholders_detected": placeholders
        },
        "content": content_blocks
    }


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

    # Robust cleaning of markdown blocks and json extraction
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()

    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        cleaned = cleaned[start_idx : end_idx + 1]

    payload = None
    # Attempt 1: Direct load
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Attempt 2: Strip trailing commas before closing braces/brackets
    if payload is None:
        try:
            repaired = re.sub(r",\s*([\]}])", r"\1", cleaned)
            payload = json.loads(repaired)
        except json.JSONDecodeError:
            pass

    # Attempt 3: Escape raw unescaped newlines/tabs inside string values
    if payload is None:
        try:
            def sanitize_string_literals(match):
                return match.group(0).replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
            repaired_strings = re.sub(r'"([^"\\]*(?:\\.[^"\\]*)*)"', sanitize_string_literals, cleaned)
            payload = json.loads(repaired_strings)
        except Exception:
            pass

    # Attempt 4: Structural Regex Extraction (handles unescaped inner quotes inside legal paragraphs)
    if payload is None:
        try:
            payload = _fallback_parse_gemini_legal_json(cleaned)
        except Exception as e:
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
    if case_context:
        enriched_case = enrich_user_prompt(case_context)
        logger.info("Original prompt: %s", case_context)
        logger.info("Enriched prompt: %s", enriched_case)
        case_context = enriched_case

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
