"""PDF extraction helpers using PyMuPDF and pdfplumber."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Any

import fitz

try:
    import pdfplumber
except ImportError:  # pragma: no cover - optional dependency in some environments
    pdfplumber = None

from .models import Block


def _normalize_bbox(bbox: Any) -> tuple[float, float, float, float]:
    if not bbox:
        return (0.0, 0.0, 0.0, 0.0)

    left, top, right, bottom = bbox
    return (float(left), float(top), float(right), float(bottom))


def _block_from_text(
    block_id: int,
    *,
    text: str,
    bbox: Any,
    source: str,
    page_number: int,
    style: dict[str, Any] | None = None,
) -> Block:
    return Block(
        id=block_id,
        type="paragraph",
        text=text.strip(),
        bounding_box=_normalize_bbox(bbox),
        style={"source": source, "page_number": page_number, **(style or {})},
    )


def _extract_with_pymupdf(pdf_path: str | Path) -> list[Block]:
    blocks: list[Block] = []
    document = fitz.open(pdf_path)
    try:
        for page_index, page in enumerate(document, start=1):
            page_dict = page.get_text("dict")
            for raw_block in page_dict.get("blocks", []):
                if raw_block.get("type") != 0:
                    continue

                spans: list[dict[str, Any]] = []
                text_parts: list[str] = []
                for line in raw_block.get("lines", []):
                    for span in line.get("spans", []):
                        span_text = span.get("text", "").strip()
                        if span_text:
                            text_parts.append(span_text)
                            spans.append(span)

                text = " ".join(text_parts).strip()
                if not text:
                    continue

                style = {}
                if spans:
                    first_span = spans[0]
                    style = {
                        "font_name": first_span.get("font"),
                        "font_size": first_span.get("size"),
                        "bold": bool(first_span.get("flags", 0) & 16),
                        "italic": bool(first_span.get("flags", 0) & 2),
                    }

                blocks.append(
                    _block_from_text(
                        len(blocks) + 1,
                        text=text,
                        bbox=raw_block.get("bbox"),
                        source="pymupdf",
                        page_number=page_index,
                        style=style,
                    )
                )
    finally:
        document.close()

    return blocks


def _extract_with_pdfplumber(pdf_path: str | Path) -> list[Block]:
    if pdfplumber is None:
        return []

    blocks: list[Block] = []
    with pdfplumber.open(pdf_path) as document:
        for page_index, page in enumerate(document.pages, start=1):
            words = page.extract_words(extra_attrs=["fontname", "size"])
            if not words:
                text = (page.extract_text() or "").strip()
                if text:
                    blocks.append(
                        _block_from_text(
                            len(blocks) + 1,
                            text=text,
                            bbox=(0, 0, page.width, page.height),
                            source="pdfplumber",
                            page_number=page_index,
                        )
                    )
                continue

            grouped_words: dict[float, list[dict[str, Any]]] = defaultdict(list)
            for word in words:
                grouped_words[round(float(word["top"]), 1)].append(word)

            for _, line_words in sorted(grouped_words.items(), key=lambda item: item[0]):
                ordered_words = sorted(line_words, key=lambda item: float(item["x0"]))
                text = " ".join(word["text"] for word in ordered_words).strip()
                if not text:
                    continue

                x0 = min(float(word["x0"]) for word in ordered_words)
                top = min(float(word["top"]) for word in ordered_words)
                x1 = max(float(word["x1"]) for word in ordered_words)
                bottom = max(float(word["bottom"]) for word in ordered_words)
                first_word = ordered_words[0]
                blocks.append(
                    _block_from_text(
                        len(blocks) + 1,
                        text=text,
                        bbox=(x0, top, x1, bottom),
                        source="pdfplumber",
                        page_number=page_index,
                        style={
                            "font_name": first_word.get("fontname"),
                            "font_size": first_word.get("size"),
                        },
                    )
                )

    return blocks


def extract_pdf_blocks(pdf_path: str | Path) -> list[Block]:
    blocks = _extract_with_pymupdf(pdf_path)
    if blocks:
        return blocks
    return _extract_with_pdfplumber(pdf_path)
