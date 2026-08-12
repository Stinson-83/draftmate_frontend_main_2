"""HTML reconstruction helpers for translated blocks."""

from __future__ import annotations

from collections import defaultdict
from html import escape
from pathlib import Path
from typing import Iterable, Sequence

from backend.translator.extractors.models import Block


def _style_css(block: Block) -> str:
    css_rules: list[str] = []
    style = block.style or {}

    font_name = style.get("font_name")
    font_size = style.get("font_size")
    if font_name:
        css_rules.append(f"font-family: {escape(str(font_name))}")
    if font_size:
        css_rules.append(f"font-size: {float(font_size)}pt")
    if style.get("bold"):
        css_rules.append("font-weight: 700")
    if style.get("italic"):
        css_rules.append("font-style: italic")

    bbox = block.bounding_box
    if bbox != (0.0, 0.0, 0.0, 0.0):
        left, top, right, bottom = bbox
        width = max(0.0, right - left)
        height = max(0.0, bottom - top)
        css_rules.extend(
            [
                "position: absolute",
                f"left: {left}pt",
                f"top: {top}pt",
                f"width: {width}pt",
                f"min-height: {height}pt",
            ]
        )

    return "; ".join(css_rules)


def _render_table(table_blocks: list[Block]) -> str:
    rows: dict[int, dict[int, Block]] = defaultdict(dict)
    for block in table_blocks:
        row_index = int(block.style.get("row_index", 1))
        column_index = int(block.style.get("column_index", 1))
        rows[row_index][column_index] = block

    table_html = ["<table class='translation-table'>"]
    for row_index in sorted(rows):
        table_html.append("<tr>")
        for column_index in sorted(rows[row_index]):
            cell = rows[row_index][column_index]
            table_html.append(f"<td>{escape(cell.text).replace(chr(10), '<br>')}</td>")
        table_html.append("</tr>")
    table_html.append("</table>")
    return "".join(table_html)


def build_html_document(blocks: Sequence[Block], title: str = "Translated Document") -> str:
    table_groups: dict[int, list[Block]] = defaultdict(list)
    emitted_tables: set[int] = set()

    page_groups: dict[int, list[Block]] = defaultdict(list)
    flow_blocks: list[Block] = []
    for block in blocks:
        if block.type == "table_cell" and "table_index" in (block.style or {}):
            table_groups[int(block.style["table_index"])]
            table_groups[int(block.style["table_index"])] .append(block)
            continue

        page_number = block.style.get("page_number") if block.style else None
        if page_number is not None and block.bounding_box != (0.0, 0.0, 0.0, 0.0):
            page_groups[int(page_number)].append(block)
        else:
            flow_blocks.append(block)

    html_parts = [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        "<meta charset='utf-8'>",
        f"<title>{escape(title)}</title>",
        "<style>",
        "body { font-family: Arial, sans-serif; margin: 24px; color: #111; }",
        ".document-flow { display: block; }",
        ".block { margin: 0 0 12px 0; white-space: pre-wrap; }",
        ".page { position: relative; margin: 24px 0; border: 1px solid #ddd; background: #fff; overflow: hidden; }",
        ".page-label { position: absolute; top: 8px; right: 8px; font-size: 11px; color: #888; }",
        ".page-block { position: absolute; white-space: pre-wrap; }",
        ".translation-table { border-collapse: collapse; margin-bottom: 12px; }",
        ".translation-table td { border: 1px solid #999; padding: 6px 8px; vertical-align: top; }",
        "</style>",
        "</head>",
        "<body>",
        "<main class='document-flow'>",
    ]

    for block in flow_blocks:
        if block.type == "table_cell" and "table_index" in (block.style or {}):
            table_index = int(block.style["table_index"])
            if table_index not in emitted_tables:
                html_parts.append(_render_table(table_groups[table_index]))
                emitted_tables.add(table_index)
            continue

        tag = "p"
        if block.type.startswith("heading"):
            tag = "h2"
        css = _style_css(block)
        html_parts.append(
            f"<{tag} class='block' style='{css}'>{escape(block.text).replace(chr(10), '<br>')}</{tag}>"
        )

    for table_index in sorted(table_groups):
        if table_index not in emitted_tables:
            html_parts.append(_render_table(table_groups[table_index]))
            emitted_tables.add(table_index)

    for page_number in sorted(page_groups):
        page_blocks = page_groups[page_number]
        page_width = max((block.bounding_box[2] for block in page_blocks), default=595.0) + 40
        page_height = max((block.bounding_box[3] for block in page_blocks), default=842.0) + 40

        html_parts.append(
            f"<section class='page' style='width: {page_width}pt; height: {page_height}pt;'>"
            f"<div class='page-label'>Page {page_number}</div>"
        )
        for block in page_blocks:
            html_parts.append(
                f"<div class='page-block' style='{_style_css(block)}'>{escape(block.text).replace(chr(10), '<br>')}</div>"
            )
        html_parts.append("</section>")

    html_parts.extend(["</main>", "</body>", "</html>"])
    return "".join(html_parts)


def rebuild_html_document(blocks: Sequence[Block], output_path: str | Path, title: str = "Translated Document") -> Path:
    html = build_html_document(blocks, title=title)
    output_path = Path(output_path)
    output_path.write_text(html, encoding="utf-8")
    return output_path
