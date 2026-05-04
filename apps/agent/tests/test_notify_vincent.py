"""Tests for the notify_vincent LangChain tool.

Verify that it delegates to ``send_lead_notification`` with the correct
keyword arguments and translates the boolean return into a short status
string for the LLM.
"""

from __future__ import annotations

from typing import Any

import pytest

import src.tools.notify_vincent as notify_mod


def _invoke(**kwargs: object) -> str:
    return notify_mod.notify_vincent.invoke(kwargs)


def test_delegates_to_send_lead_notification(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def _fake_send(**kwargs: Any) -> bool:
        captured.update(kwargs)
        return True

    monkeypatch.setattr(notify_mod, "send_lead_notification", _fake_send)

    out = _invoke(
        summary="Senior RAG mission for fintech, 2-week start, team of 4.",
        intent_signal="freelance-mission",
        transcript_excerpts=["start in 2 weeks"],
        locale="fr",
    )

    assert out == "notified"
    assert captured["subject"] == "[amplyd lead] freelance-mission"
    assert captured["summary"].startswith("Senior RAG mission")
    assert captured["transcript_excerpts"] == ["start in 2 weeks"]
    assert captured["locale"] == "fr"


def test_returns_skipped_when_email_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(notify_mod, "send_lead_notification", lambda **_: False)
    out = _invoke(summary="x", intent_signal="cdi-role")
    assert out == "notify-skipped"


def test_excerpts_default_to_none(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def _fake_send(**kwargs: Any) -> bool:
        captured.update(kwargs)
        return True

    monkeypatch.setattr(notify_mod, "send_lead_notification", _fake_send)
    _invoke(summary="ok", intent_signal="explicit-request")
    assert captured["transcript_excerpts"] is None
    assert captured["locale"] == "en"
