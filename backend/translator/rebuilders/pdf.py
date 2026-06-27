"""PDF reconstruction helpers for translated blocks."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Sequence

import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from backend.translator.extractors.models import Block

import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from backend.translator.extractors.models import Block

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage"

FONT_REGISTRY = {
    "hi-IN": "NotoSansDevanagari-Regular.ttf",
    "sa-IN": "NotoSansDevanagari-Regular.ttf",
    "mr-IN": "NotoSansDevanagari-Regular.ttf",
    "ne-IN": "NotoSansDevanagari-Regular.ttf",
    "kok-IN": "NotoSansDevanagari-Regular.ttf",
    "brx-IN": "NotoSansDevanagari-Regular.ttf",
    "doi-IN": "NotoSansDevanagari-Regular.ttf",
    "mai-IN": "NotoSansDevanagari-Regular.ttf",
    "bn-IN": "NotoSansBengali-Regular.ttf",
    "as-IN": "NotoSansBengali-Regular.ttf",
    "gu-IN": "NotoSansGujarati-Regular.ttf",
    "pa-IN": "NotoSansGurmukhi-Regular.ttf",
    "od-IN": "NotoSansOriya-Regular.ttf",
    "ta-IN": "NotoSansTamil-Regular.ttf",
    "te-IN": "NotoSansTelugu-Regular.ttf",
    "kn-IN": "NotoSansKannada-Regular.ttf",
    "ml-IN": "NotoSansMalayalam-Regular.ttf",
    "ur-IN": "NotoNastaliqUrdu-Regular.ttf",
}

LANGUAGE_FONT_MAP = {}

# Register each font if it exists in storage
for lang, filename in FONT_REGISTRY.items():
    font_path = STORAGE_DIR / filename
    if font_path.exists():
        font_name = filename.split("-")[0]  # e.g., "NotoSansDevanagari"
        if font_name not in pdfmetrics.getRegisteredFontNames():
            try:
                pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
            except Exception as e:
                print(f"[FONT REGISTER ERROR] Failed to register {font_name}: {e}")
                continue
        LANGUAGE_FONT_MAP[lang] = font_name

# Fallback Devanagari font paths (system lookup)
SYSTEM_DEVANAGARI_PATHS = [
    "C:/Windows/Fonts/mangal.ttf",
    "C:/Windows/Fonts/kokila.ttf",
    "C:/Windows/Fonts/utsaah.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
]
for path in SYSTEM_DEVANAGARI_PATHS:
    if os.path.exists(path) and "hi-IN" not in LANGUAGE_FONT_MAP:
        try:
            pdfmetrics.registerFont(TTFont("SystemDevanagari", path))
            for lang in ["hi-IN", "sa-IN", "mr-IN", "ne-IN", "kok-IN", "brx-IN", "doi-IN", "mai-IN"]:
                LANGUAGE_FONT_MAP[lang] = "SystemDevanagari"
            break
        except Exception:
            continue


def _font_name(block: Block) -> str:
    style = block.style or {}
    target_lang = style.get("target_language")

    # Use specific registered font for the target script if available
    if target_lang in LANGUAGE_FONT_MAP:
        return LANGUAGE_FONT_MAP[target_lang]

    font_name = str(style.get("font_name") or "Helvetica")
    bold = bool(style.get("bold"))
    italic = bool(style.get("italic"))

    if "Helvetica" in font_name:
        if bold and italic:
            return "Helvetica-BoldOblique"
        if bold:
            return "Helvetica-Bold"
        if italic:
            return "Helvetica-Oblique"
        return "Helvetica"

    return font_name if font_name in pdfmetrics.standardFonts else "Helvetica"


def _split_lines(text: str, max_width: float, font_name: str, font_size: float) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current_line = words[0]
    for word in words[1:]:
        candidate = f"{current_line} {word}"
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current_line = candidate
        else:
            lines.append(current_line)
            current_line = word
    lines.append(current_line)
    return lines


def rebuild_pdf_document(blocks: Sequence[Block], output_path: str | Path) -> Path:
    output_path = Path(output_path)
    pages: dict[int, list[Block]] = defaultdict(list)
    for block in blocks:
        page_number = int((block.style or {}).get("page_number", 1) or 1)
        pages[page_number].append(block)

    canvas_file = canvas.Canvas(str(output_path))

    for page_number in sorted(pages):
        page_blocks = pages[page_number]
        page_width = max((block.bounding_box[2] for block in page_blocks), default=letter[0]) + 40
        page_height = max((block.bounding_box[3] for block in page_blocks), default=letter[1]) + 40
        canvas_file.setPageSize((page_width, page_height))

        used_table_indices: set[int] = set()
        table_groups: dict[int, list[Block]] = defaultdict(list)
        for block in page_blocks:
            if block.type == "table_cell" and "table_index" in (block.style or {}):
                table_groups[int(block.style["table_index"])] .append(block)

        cursor_y = page_height - 24
        for block in page_blocks:
            if block.type == "table_cell" and "table_index" in (block.style or {}):
                table_index = int(block.style["table_index"])
                if table_index in used_table_indices:
                    continue
                used_table_indices.add(table_index)
                for table_block in table_groups[table_index]:
                    _draw_block(canvas_file, table_block, page_height)
                continue

            cursor_y = _draw_block(canvas_file, block, page_height, cursor_y)

        canvas_file.showPage()

    canvas_file.save()
    return output_path


def _draw_block(pdf_canvas: canvas.Canvas, block: Block, page_height: float, cursor_y: float | None = None) -> float:
    style = block.style or {}
    font_size = float(style.get("font_size") or 12)
    font_name = _font_name(block)
    pdf_canvas.setFont(font_name, font_size)

    if block.bounding_box != (0.0, 0.0, 0.0, 0.0):
        left, top, right, bottom = block.bounding_box
        x = left + 24
        y = page_height - top - font_size - 24
        max_width = max(24.0, right - left)
    else:
        x = 24
        if cursor_y is None:
            cursor_y = page_height - 24
        y = cursor_y
        max_width = page_height - 48

    lines = _split_lines(block.text, max_width=max_width, font_name=font_name, font_size=font_size)
    line_height = font_size * 1.25
    for line_index, line in enumerate(lines):
        pdf_canvas.drawString(x, y - (line_index * line_height), line)

    if block.bounding_box != (0.0, 0.0, 0.0, 0.0):
        return cursor_y if cursor_y is not None else page_height - 24

    return y - (len(lines) * line_height) - 12
