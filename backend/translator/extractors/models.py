"""Structured block models for document extraction."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class Block:
    id: int
    type: str
    text: str
    bounding_box: tuple[float, float, float, float]
    style: dict[str, Any] = field(default_factory=dict)
