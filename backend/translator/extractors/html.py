"""HTML extraction helpers for translator documents."""

from __future__ import annotations

from pathlib import Path

from bs4 import BeautifulSoup

from .models import Block


def extract_html_blocks(html_path: str | Path) -> list[Block]:
    html_text = Path(html_path).read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(html_text, "html.parser")
    blocks: list[Block] = []

    for element in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th"]):
        text = element.get_text(" ", strip=True)
        if not text:
            continue

        tag_name = element.name.lower()
        if tag_name.startswith("h") and len(tag_name) == 2 and tag_name[1].isdigit():
            block_type = "heading"
            style = {"tag_name": tag_name, "level": int(tag_name[1])}
        elif tag_name in {"td", "th"}:
            block_type = "table_cell"
            style = {"tag_name": tag_name}
        elif tag_name == "li":
            block_type = "list_item"
            style = {"tag_name": tag_name}
        else:
            block_type = "paragraph"
            style = {"tag_name": tag_name}

        blocks.append(
            Block(
                id=len(blocks) + 1,
                type=block_type,
                text=text,
                bounding_box=(0.0, 0.0, 0.0, 0.0),
                style=style,
            )
        )

    return blocks
