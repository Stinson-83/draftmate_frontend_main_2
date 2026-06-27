"""Sarvam AI translation wrapper for document blocks.

Response parsing follows the Sarvam translate API docs:
- request_id: opaque request identifier
- translated_text: translated string result
- source_language_code: detected or provided source language code
"""

from __future__ import annotations

from dataclasses import replace
from typing import Iterable, Sequence

import requests

from backend.translator.extractors.models import Block
from backend.translator.settings import (
    SARVAM_API_KEY as TRANSLATOR_SARVAM_API_KEY,
    SARVAM_API_URL as TRANSLATOR_SARVAM_API_URL,
    SARVAM_TRANSLATE_BATCH_SIZE as TRANSLATOR_SARVAM_TRANSLATE_BATCH_SIZE,
    SARVAM_TRANSLATE_MODEL as TRANSLATOR_SARVAM_TRANSLATE_MODEL,
    SARVAM_TRANSLATE_TIMEOUT_SECONDS as TRANSLATOR_SARVAM_TRANSLATE_TIMEOUT_SECONDS,
    SARVAM_LANGUAGE_CODES,
    SARVAM_MAYURA_LANGUAGE_CODES,
)

SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/translate"
SARVAM_MAYURA_MODEL = "mayura:v1"
_SUPPORTED_MAYURA_LANGS = set(SARVAM_MAYURA_LANGUAGE_CODES)
_SUPPORTED_SARVAM_TRANSLATE_LANGS = set(SARVAM_LANGUAGE_CODES)
_COMMON_LANGUAGE_MAP = {
    "bn": "bn-IN",
    "brx": "brx-IN",
    "as": "as-IN",
    "doi": "doi-IN",
    "en": "en-IN",
    "gu": "gu-IN",
    "hi": "hi-IN",
    "kn": "kn-IN",
    "kok": "kok-IN",
    "ks": "ks-IN",
    "mai": "mai-IN",
    "ml": "ml-IN",
    "mni": "mni-IN",
    "mr": "mr-IN",
    "ne": "ne-IN",
    "od": "od-IN",
    "pa": "pa-IN",
    "sa": "sa-IN",
    "sat": "sat-IN",
    "sd": "sd-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "ur": "ur-IN",
}


def _get_api_key() -> str:
    return TRANSLATOR_SARVAM_API_KEY


def _get_api_url() -> str:
    return TRANSLATOR_SARVAM_API_URL or SARVAM_TRANSLATE_URL


def _get_model() -> str:
    return TRANSLATOR_SARVAM_TRANSLATE_MODEL or "sarvam-translate:v1"


def _get_timeout_seconds() -> int:
    return max(1, TRANSLATOR_SARVAM_TRANSLATE_TIMEOUT_SECONDS)


def _chunked(items: Sequence[Block], batch_size: int) -> Iterable[list[Block]]:
    for start_index in range(0, len(items), batch_size):
        yield list(items[start_index : start_index + batch_size])


def _normalize_language_code(language_code: str) -> str:
    normalized = (language_code or "").strip()
    if not normalized:
        raise ValueError("Language code cannot be empty")

    if normalized.lower() == "auto":
        return "auto"

    if normalized in _SUPPORTED_SARVAM_TRANSLATE_LANGS:
        return normalized

    lowered = normalized.lower()
    if lowered in _COMMON_LANGUAGE_MAP:
        return _COMMON_LANGUAGE_MAP[lowered]

    if "-" in normalized:
        prefix, suffix = normalized.split("-", 1)
        return f"{prefix.lower()}-{suffix.upper()}"

    raise ValueError(f"Unsupported language code: {language_code}")


def _choose_model(source_language_code: str, target_language_code: str) -> str:
    if source_language_code == "auto":
        if target_language_code not in _SUPPORTED_MAYURA_LANGS:
            raise ValueError(
                "Automatic source detection requires a target language supported by Mayura (11-language set)."
            )
        return SARVAM_MAYURA_MODEL

    if source_language_code not in _SUPPORTED_SARVAM_TRANSLATE_LANGS:
        raise ValueError(f"Unsupported source language for Sarvam Translate: {source_language_code}")

    if target_language_code not in _SUPPORTED_SARVAM_TRANSLATE_LANGS:
        raise ValueError(f"Unsupported target language for Sarvam Translate: {target_language_code}")

    return _get_model()


def _is_quota_error(status_code: int, payload: object, response_text: str) -> bool:
    if status_code == 429:
        return True

    haystack = f"{payload!r} {response_text}".lower()
    return any(marker in haystack for marker in ("quota", "rate limit", "too many requests"))


class SarvamTranslateError(Exception):
    """Raised when Sarvam translation fails."""


class SarvamQuotaExceededError(SarvamTranslateError):
    """Raised when Sarvam returns a quota or rate-limit error."""


class SarvamTranslateClient:
    """Sarvam AI text translation client that translates one text per request.

    The public Sarvam translate endpoint expects a single `input` string and
    returns a flat JSON payload with `request_id`, `translated_text`, and
    `source_language_code`. This client preserves batch order by issuing one
    request per input text and collecting the translated strings in order.
    """

    def __init__(
        self,
        api_key: str | None = None,
        api_url: str | None = None,
        timeout_seconds: int | None = None,
        session: requests.Session | None = None,
    ) -> None:
        self.api_key = (api_key or _get_api_key()).strip()
        self.api_url = (api_url or _get_api_url()).strip()
        self.timeout_seconds = timeout_seconds or _get_timeout_seconds()
        self.session = session or requests.Session()

        if not self.api_key:
            raise ValueError("SARVAM_API_KEY is not configured")

    def _translate_text(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> tuple[str, str, str | None]:
        import time
        import random
        normalized_source = _normalize_language_code(source_language)
        normalized_target = _normalize_language_code(target_language)
        model = _choose_model(normalized_source, normalized_target)

        request_body: dict[str, object] = {
            "input": text,
            "source_language_code": normalized_source,
            "target_language_code": normalized_target,
            "model": model,
            "mode": "formal",
        }

        max_retries = 6
        backoff_factor = 2.0
        
        for attempt in range(max_retries):
            try:
                response = self.session.post(
                    self.api_url,
                    headers={
                        "api-subscription-key": self.api_key,
                        "Content-Type": "application/json",
                    },
                    json=request_body,
                    timeout=self.timeout_seconds,
                )
                
                response_text = response.text
                try:
                    payload = response.json()
                except ValueError:
                    payload = None

                if response.status_code == 429 or _is_quota_error(response.status_code, payload, response_text):
                    if attempt == max_retries - 1:
                        raise SarvamQuotaExceededError(self._format_error_message(response.status_code, payload, response_text))
                    
                    sleep_time = (backoff_factor ** attempt) + random.uniform(0.1, 0.5)
                    print(f"[SARVAM CLIENT] Rate limited (429). Retrying in {sleep_time:.2f} seconds (attempt {attempt + 1}/{max_retries})...")
                    time.sleep(sleep_time)
                    continue

                if response.status_code >= 400:
                    raise SarvamTranslateError(self._format_error_message(response.status_code, payload, response_text))

                break
            except requests.RequestException as error:
                if attempt == max_retries - 1:
                    raise SarvamTranslateError(f"Network error during translation request: {error}") from error
                sleep_time = (backoff_factor ** attempt) + random.uniform(0.1, 0.5)
                time.sleep(sleep_time)

        translated_text, request_id, returned_source = self._parse_response(payload)
        return translated_text, request_id, returned_source

    @staticmethod
    def _parse_response(payload: object) -> tuple[str, str | None, str | None]:
        if not isinstance(payload, dict):
            raise SarvamTranslateError("Sarvam translation response was not valid JSON.")

        translated_text = payload.get("translated_text")
        if not isinstance(translated_text, str):
            nested = payload.get("data")
            if isinstance(nested, dict):
                translated_text = nested.get("translated_text")

        if not isinstance(translated_text, str):
            raise SarvamTranslateError("Sarvam translation response did not include translated_text.")

        request_id = payload.get("request_id")
        if request_id is not None and not isinstance(request_id, str):
            request_id = str(request_id)

        source_language_code = payload.get("source_language_code")
        if source_language_code is not None and not isinstance(source_language_code, str):
            source_language_code = str(source_language_code)

        return translated_text, request_id, source_language_code

    @staticmethod
    def _format_error_message(status_code: int, payload: object, response_text: str) -> str:
        if isinstance(payload, dict):
            message = payload.get("message") or payload.get("error") or payload.get("detail")
            if isinstance(message, dict):
                message = message.get("message") or message.get("detail")
            if isinstance(message, str) and message.strip():
                return f"Sarvam translation failed with status {status_code}: {message.strip()}"

        cleaned_text = response_text.strip()
        if cleaned_text:
            return f"Sarvam translation failed with status {status_code}: {cleaned_text}"

        return f"Sarvam translation failed with status {status_code}."

    def translate_texts(self, texts: list[str], source_language: str, target_language: str) -> list[str]:
        import time
        if not texts:
            return []

        translated_texts: list[str] = []
        for text in texts:
            translated_text, _, _ = self._translate_text(text, source_language, target_language)
            translated_texts.append(translated_text)
            time.sleep(0.1) # Smooth out requests to avoid hitting rate limit triggers

        return translated_texts

    def translate_blocks(self, blocks: Sequence[Block], source_language: str, target_language: str) -> list[Block]:
        translated_blocks: list[Block] = []

        for batch in _chunked(list(blocks), max(1, TRANSLATOR_SARVAM_TRANSLATE_BATCH_SIZE)):
            translated_texts = self.translate_texts(
                [block.text for block in batch],
                source_language=source_language,
                target_language=target_language,
            )

            for block, translated_text in zip(batch, translated_texts, strict=True):
                translated_blocks.append(
                    replace(
                        block,
                        text=translated_text,
                        style={
                            **block.style,
                            "source_language": source_language,
                            "target_language": target_language,
                            "translation_provider": "sarvam_translate_api",
                        },
                    )
                )

        return translated_blocks


def sarvam_translate(texts: list[str], src_lang: str, tgt_lang: str) -> list[str]:
    """Translate a batch of texts with Sarvam AI and preserve input order."""

    client = SarvamTranslateClient()
    return client.translate_texts(texts, source_language=src_lang, target_language=tgt_lang)


def get_supported_source_language_codes() -> tuple[str, ...]:
    return ("auto", *SARVAM_LANGUAGE_CODES)


def get_supported_target_language_codes(source_language: str) -> tuple[str, ...]:
    normalized_source = (source_language or "").strip().lower()
    if normalized_source == "auto":
        return SARVAM_MAYURA_LANGUAGE_CODES
    return SARVAM_LANGUAGE_CODES


def translate_block_texts(blocks: Sequence[Block], source_language: str, target_language: str) -> list[Block]:
    client = SarvamTranslateClient()
    return client.translate_blocks(blocks, source_language=source_language, target_language=target_language)


def translate_blocks(blocks: Sequence[Block], source_language: str, target_language: str) -> list[Block]:
    return translate_block_texts(blocks, source_language=source_language, target_language=target_language)