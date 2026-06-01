from __future__ import annotations

from dataclasses import replace

import pytest

from backend.translator.extractors.models import Block
from backend.translator.translators.google_translate import GoogleTranslateClient


class _FakeResponse:
    def __init__(self, payload: dict[str, object]) -> None:
        self.payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, object]:
        return self.payload


class _FakeSession:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    def post(self, url: str, *, params: dict[str, object], data: dict[str, object], timeout: int):
        self.calls.append({"url": url, "params": params, "data": data, "timeout": timeout})
        texts = list(data["q"])
        translations = [{"translatedText": f"translated:{text}"} for text in texts]
        return _FakeResponse({"data": {"translations": translations}})


def test_translate_blocks_batches_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_TRANSLATE_API_KEY", "test-key")
    client = GoogleTranslateClient(api_key="test-key", batch_size=2, session=_FakeSession())

    blocks = [
        Block(id=1, type="paragraph", text="hello", bounding_box=(0.0, 0.0, 1.0, 1.0), style={}),
        Block(id=2, type="paragraph", text="world", bounding_box=(0.0, 0.0, 1.0, 1.0), style={}),
        Block(id=3, type="paragraph", text="again", bounding_box=(0.0, 0.0, 1.0, 1.0), style={}),
    ]

    translated = client.translate_blocks(blocks, source_language="en", target_language="es")

    assert [block.text for block in translated] == ["translated:hello", "translated:world", "translated:again"]
    assert len(client.session.calls) == 2
    assert client.session.calls[0]["data"]["q"] == ["hello", "world"]
    assert client.session.calls[1]["data"]["q"] == ["again"]


def test_translate_blocks_preserves_structure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_TRANSLATE_API_KEY", "test-key")
    fake_session = _FakeSession()
    client = GoogleTranslateClient(api_key="test-key", batch_size=10, session=fake_session)

    block = Block(
        id=1,
        type="heading",
        text="Hello",
        bounding_box=(1.0, 2.0, 3.0, 4.0),
        style={"font_name": "Helvetica", "bold": True},
    )

    translated = client.translate_blocks([block], source_language="en", target_language="fr")

    assert translated[0].id == block.id
    assert translated[0].type == block.type
    assert translated[0].bounding_box == block.bounding_box
    assert translated[0].text == "translated:Hello"
    assert translated[0].style["translation_provider"] == "google_translate_api"
    assert translated[0].style["target_language"] == "fr"
