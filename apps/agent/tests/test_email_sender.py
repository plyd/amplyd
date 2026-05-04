"""Tests for the Resend wrapper.

We never hit Resend in tests — we patch ``resend.Emails.send`` and assert on
the payload we would have sent.
"""

from __future__ import annotations

from typing import Any

import pytest

import src.email_sender as email_sender
import src.settings as settings_mod


@pytest.fixture(autouse=True)
def _reset_settings(monkeypatch: pytest.MonkeyPatch):
    """Each test gets a fresh Settings singleton so env overrides apply."""
    monkeypatch.setattr(settings_mod, "_settings", None)
    yield
    monkeypatch.setattr(settings_mod, "_settings", None)


def test_returns_false_when_resend_key_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.setenv("OWNER_EMAIL", "vincent@example.com")
    sent = email_sender.send_lead_notification(subject="x", summary="y")
    assert sent is False


def test_returns_false_when_owner_email_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    monkeypatch.setenv("OWNER_EMAIL", "")
    sent = email_sender.send_lead_notification(subject="x", summary="y")
    assert sent is False


def test_sends_payload_with_summary_and_excerpts(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    monkeypatch.setenv("OWNER_EMAIL", "vincent@example.com")

    captured: dict[str, Any] = {}

    class _FakeEmails:
        @staticmethod
        def send(payload: dict[str, Any]) -> dict[str, Any]:
            captured.update(payload)
            return {"id": "fake-id"}

    monkeypatch.setattr(email_sender.resend, "Emails", _FakeEmails)

    ok = email_sender.send_lead_notification(
        subject="[amplyd lead] freelance-mission",
        summary="Visitor described a senior RAG mission for a fintech.",
        transcript_excerpts=["we need someone in 2 weeks", "team of 4"],
        locale="fr",
    )

    assert ok is True
    assert captured["to"] == "vincent@example.com"
    assert captured["subject"] == "[amplyd lead] freelance-mission"
    assert captured["from"] == "hello@amplyd.com"
    assert captured["reply_to"] == "hello@amplyd.com"
    assert "RAG mission" in captured["html"]
    assert "we need someone in 2 weeks" in captured["html"]
    assert "team of 4" in captured["html"]
    assert "(fr)" in captured["html"]


def test_returns_false_on_transport_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    monkeypatch.setenv("OWNER_EMAIL", "vincent@example.com")

    class _BoomEmails:
        @staticmethod
        def send(payload: dict[str, Any]) -> dict[str, Any]:
            raise RuntimeError("Resend down")

    monkeypatch.setattr(email_sender.resend, "Emails", _BoomEmails)

    ok = email_sender.send_lead_notification(subject="x", summary="y")
    assert ok is False


def test_html_escapes_user_supplied_strings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    monkeypatch.setenv("OWNER_EMAIL", "vincent@example.com")

    captured: dict[str, Any] = {}

    class _FakeEmails:
        @staticmethod
        def send(payload: dict[str, Any]) -> dict[str, Any]:
            captured.update(payload)
            return {"id": "ok"}

    monkeypatch.setattr(email_sender.resend, "Emails", _FakeEmails)

    email_sender.send_lead_notification(
        subject="x",
        summary="<script>alert(1)</script>",
        transcript_excerpts=["<img onerror=foo>"],
    )

    html = captured["html"]
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "<img onerror=foo>" not in html
    assert "&lt;img onerror=foo&gt;" in html
