from __future__ import annotations

import pytest

from backend.translator.extractors.models import Block
from backend.translator.translators.sarvam_translate import SarvamQuotaExceededError, SarvamTranslateClient, SarvamTranslateError


class _FakeResponse:
    def __init__(self, status_code: int, payload: dict[str, object] | None = None, text: str = "") -> None:
        self.status_code = status_code
        self.payload = payload or {}
        self.text = text or (str(payload) if payload is not None else "")

    def json(self) -> dict[str, object]:
        if self.payload is None:
            raise ValueError("invalid json")
        return self.payload


class _FakeSession:
    def __init__(self, responses: list[_FakeResponse]) -> None:
        self.responses = responses
        self.calls: list[dict[str, object]] = []

    def post(self, url: str, *, headers: dict[str, object], json: dict[str, object], timeout: int):
        self.calls.append({"url": url, "headers": headers, "json": json, "timeout": timeout})
        return self.responses.pop(0)


@pytest.mark.parametrize(
    ("source_language", "target_language", "expected_source_code", "expected_target_code", "translated_text"),
    [
        ("hi", "en", "hi-IN", "en-IN", "hello"),
        ("en", "hi", "en-IN", "hi-IN", "नमस्ते"),
        ("mr", "gu", "mr-IN", "gu-IN", "નમસ્તે"),
        ("gu", "mr", "gu-IN", "mr-IN", "नमस्कार"),
    ],
)
def test_sarvam_translate_supports_indian_language_pairs(
    monkeypatch: pytest.MonkeyPatch,
    source_language: str,
    target_language: str,
    expected_source_code: str,
    expected_target_code: str,
    translated_text: str,
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test-key")
    session = _FakeSession([
        _FakeResponse(200, {"request_id": "1", "translated_text": translated_text, "source_language_code": expected_source_code}),
    ])

    client = SarvamTranslateClient(api_key="test-key", session=session)
    translated = client.translate_texts(["hello"], source_language=source_language, target_language=target_language)

    assert translated == [translated_text]
    assert session.calls[0]["json"]["source_language_code"] == expected_source_code
    assert session.calls[0]["json"]["target_language_code"] == expected_target_code


def test_sarvam_translate_batches_requests_and_preserves_order(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test-key")
    session = _FakeSession(
        [
            _FakeResponse(200, {"request_id": "1", "translated_text": "hola", "source_language_code": "en-IN"}),
            _FakeResponse(200, {"request_id": "2", "translated_text": "mundo", "source_language_code": "en-IN"}),
        ]
    )

    client = SarvamTranslateClient(api_key="test-key", session=session)
    translated = client.translate_texts(["hello", "world"], source_language="en", target_language="hi")

    assert translated == ["hola", "mundo"]
    assert len(session.calls) == 2
    assert session.calls[0]["headers"]["api-subscription-key"] == "test-key"
    assert session.calls[0]["json"]["input"] == "hello"
    assert session.calls[0]["json"]["source_language_code"] == "en-IN"
    assert session.calls[0]["json"]["target_language_code"] == "hi-IN"
    assert session.calls[0]["json"]["model"] == "sarvam-translate:v1"


def test_sarvam_translate_maps_blocks(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test-key")
    session = _FakeSession([
        _FakeResponse(200, {"request_id": "1", "translated_text": "नमस्ते", "source_language_code": "en-IN"}),
    ])

    client = SarvamTranslateClient(api_key="test-key", session=session)

    block = Block(id=1, type="paragraph", text="hello", bounding_box=(0.0, 0.0, 1.0, 1.0), style={})
    translated = client.translate_blocks([block], source_language="en", target_language="hi")

    assert translated[0].text == "नमस्ते"
    assert translated[0].style["translation_provider"] == "sarvam_translate_api"


def test_sarvam_translate_raises_quota_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test-key")
    import time
    monkeypatch.setattr(time, "sleep", lambda x: None)

    # Provide 6 responses because max_retries is 6
    session = _FakeSession([
        _FakeResponse(429, {"message": "Quota exceeded"}, text="Quota exceeded")
        for _ in range(6)
    ])

    client = SarvamTranslateClient(api_key="test-key", session=session)

    with pytest.raises(SarvamQuotaExceededError, match="Quota exceeded"):
        client.translate_texts(["hello"], source_language="en", target_language="hi")


def test_sarvam_translate_raises_clear_api_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test-key")
    session = _FakeSession([_FakeResponse(503, {"message": "Service unavailable"}, text="Service unavailable")])

    client = SarvamTranslateClient(api_key="test-key", session=session)

    with pytest.raises(SarvamTranslateError, match="Sarvam translation failed with status 503: Service unavailable"):
        client.translate_texts(["hello"], source_language="en", target_language="hi")


def test_sarvam_translate_rejects_unsupported_language_codes(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test-key")
    client = SarvamTranslateClient(api_key="test-key", session=_FakeSession([]))

    with pytest.raises(ValueError, match="Unsupported source language for Sarvam Translate: xx-IN"):
        client.translate_texts(["hello"], source_language="xx-IN", target_language="hi")