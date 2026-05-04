"""Tests for the book_meeting LangChain tool."""

from __future__ import annotations

import pytest

from src.tools.book_meeting import book_meeting


def _invoke(**kwargs: object) -> dict[str, object]:
    return book_meeting.invoke(kwargs)


def test_returns_book_meeting_payload() -> None:
    out = _invoke(context="visitor wants to discuss a senior RAG mission")
    assert out["type"] == "book_meeting"
    assert isinstance(out["url"], str)
    assert out["url"].startswith("https://cal.eu/")
    assert out["context"] == "visitor wants to discuss a senior RAG mission"


def test_strips_context_whitespace() -> None:
    out = _invoke(context="   strong intent  \n")
    assert out["context"] == "strong intent"


def test_url_uses_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    import src.settings as settings_mod

    # Clear the singleton so our env override is picked up.
    monkeypatch.setattr(settings_mod, "_settings", None)
    monkeypatch.setenv("CALCOM_USERNAME", "someone-else")
    monkeypatch.setenv("CALCOM_EVENT_SLUG", "60min")

    try:
        out = _invoke(context="any")
        assert out["url"] == "https://cal.eu/someone-else/60min"
    finally:
        # Reset for downstream tests.
        monkeypatch.setattr(settings_mod, "_settings", None)
