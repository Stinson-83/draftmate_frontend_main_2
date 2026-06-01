"""Google Translate API wrapper for document blocks."""

from __future__ import annotations

import os
from dataclasses import replace
from typing import Iterable, Sequence

import requests
from dotenv import load_dotenv

from backend.translator.extractors.models import Block

load_dotenv()


def _get_api_key() -> str:
    return os.getenv("GOOGLE_TRANSLATE_API_KEY", "").strip()


def _get_api_url() -> str:
    return os.getenv(
        "GOOGLE_TRANSLATE_API_URL",
        "https://translation.googleapis.com/language/translate/v2",
    ).strip()


def _get_batch_size() -> int:
    raw_value = os.getenv("GOOGLE_TRANSLATE_BATCH_SIZE", "50").strip()
    try:
        return max(1, int(raw_value))
    except ValueError:
        return 50


def _chunked(items: Sequence[Block], batch_size: int) -> Iterable[list[Block]]:
    for start_index in range(0, len(items), batch_size):
        yield list(items[start_index : start_index + batch_size])


class GoogleTranslateClient:
    """Minimal Google Translate client that batches block text requests."""

    def __init__(
        self,
        api_key: str | None = None,
        api_url: str | None = None,
        batch_size: int | None = None,
        timeout_seconds: int = 30,
        session: requests.Session | None = None,
    ) -> None:
        self.api_key = (api_key or _get_api_key()).strip()
        self.api_url = (api_url or _get_api_url()).strip()
        self.batch_size = batch_size or _get_batch_size()
        self.timeout_seconds = timeout_seconds
        self.session = session or requests.Session()

        if not self.api_key:
            raise ValueError("GOOGLE_TRANSLATE_API_KEY is not configured")

    def translate_texts(
        self,
        texts: list[str],
        source_language: str | None,
        target_language: str,
    ) -> list[str]:
        if not texts:
            return []

        request_data: dict[str, object] = {
            "q": texts,
            "target": target_language,
            "format": "text",
        }
        normalized_source = (source_language or "").strip().lower()
        if normalized_source and normalized_source != "auto":
            request_data["source"] = normalized_source

        response = self.session.post(
            self.api_url,
            params={"key": self.api_key},
            data=request_data,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()

        payload = response.json()
        translations = payload.get("data", {}).get("translations", [])
        translated_texts = [item.get("translatedText", "") for item in translations]

        if len(translated_texts) != len(texts):
            raise ValueError("Google Translate API returned an unexpected number of translations")

        return translated_texts

    def translate_blocks(
        self,
        blocks: Sequence[Block],
        source_language: str | None,
        target_language: str,
    ) -> list[Block]:
        translated_blocks: list[Block] = []

        for batch in _chunked(list(blocks), self.batch_size):
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
                            "translation_provider": "google_translate_api",
                        },
                    )
                )

        return translated_blocks


def translate_block_texts(blocks: Sequence[Block], source_language: str, target_language: str) -> list[Block]:
    """Translate a list of blocks using the configured Google Translate client."""

    client = GoogleTranslateClient()
    return client.translate_blocks(blocks, source_language=source_language, target_language=target_language)


def translate_blocks(blocks: Sequence[Block], source_language: str, target_language: str) -> list[Block]:
    """Backwards-friendly alias for translating block lists."""

    return translate_block_texts(blocks, source_language=source_language, target_language=target_language)
