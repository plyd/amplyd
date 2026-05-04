"""Resend wrapper — single entry point to send Vincent the lead summary.

Kept tiny on purpose: one function that swallows transport errors so a
flaky Resend can never crash a chat turn. The boolean return tells callers
whether the email actually went out (used by the tool to phrase its
acknowledgement to the LLM).
"""

from __future__ import annotations

import logging
from typing import Any

import resend

from src.settings import get_settings

logger = logging.getLogger("amplyd.agent.email")


def send_lead_notification(
    *,
    subject: str,
    summary: str,
    transcript_excerpts: list[str] | None = None,
    locale: str = "en",
) -> bool:
    """Email Vincent a qualified lead summary. No-op if Resend isn't configured.

    Args:
        subject: Short subject line (already includes prefix if needed).
        summary: Plain-text 1-5 lines of context written by the agent.
        transcript_excerpts: Optional verbatim quotes from the conversation
            the agent judged worth showing.
        locale: Visitor's locale, surfaced in the email body.

    Returns:
        True if the email was sent successfully, False otherwise (missing
        config, transport error, etc.).
    """
    settings = get_settings()
    if not settings.resend_api_key or not settings.owner_email:
        logger.info(
            "send_lead_notification skipped: resend_api_key=%s owner_email=%s",
            bool(settings.resend_api_key),
            bool(settings.owner_email),
        )
        return False

    resend.api_key = settings.resend_api_key

    excerpts_html = ""
    if transcript_excerpts:
        items = "".join(
            f"<li style='margin:6px 0'>{_escape_html(q)}</li>" for q in transcript_excerpts
        )
        excerpts_html = (
            "<p><strong>Verbatims</strong></p>"
            f"<ul style='padding-left:18px'>{items}</ul>"
        )

    html = (
        "<div style='font-family:-apple-system,system-ui,sans-serif;font-size:14px;line-height:1.5'>"
        f"<p><strong>Lead from amplyd.com</strong> ({locale})</p>"
        f"<p>{_escape_html(summary).replace(chr(10), '<br>')}</p>"
        f"{excerpts_html}"
        "<hr style='border:none;border-top:1px solid #eee;margin:16px 0'>"
        "<p style='color:#888;font-size:12px'>Sent automatically by your site agent.</p>"
        "</div>"
    )

    try:
        resend.Emails.send(
            {
                "from": settings.resend_from_email,
                "to": settings.owner_email,
                "subject": subject,
                "html": html,
                "reply_to": settings.resend_from_email,
            }
        )
        return True
    except Exception as exc:  # pragma: no cover - transport errors logged only
        logger.warning("Resend send failed: %s", exc)
        return False


def _escape_html(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


# Exposed so tests can monkeypatch a fake module-level send.
__all__ = ["send_lead_notification"]


def _send(payload: dict[str, Any]) -> Any:  # pragma: no cover - internal alias
    """Indirection so tests can patch the actual Resend call easily."""
    return resend.Emails.send(payload)
