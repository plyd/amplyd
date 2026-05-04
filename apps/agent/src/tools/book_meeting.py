"""``book_meeting`` LangChain tool — surface a Cal.com CTA inline in the chat.

The agent calls this when the visitor expressed an intent strong enough to
warrant a booking (concrete project, explicit ask for a call, lead-qual
signals). The tool does NOT collect emails or phone numbers — Cal.com handles
that flow itself, which keeps the chat zero-PII on our side.

The returned payload is emitted by the agent loop as a custom data part
(``data-book-meeting``) and rendered as an inline button in the chat
(``ChatPanel.tsx``).
"""

from __future__ import annotations

from typing import Any

from langchain_core.tools import tool

from src.settings import get_settings


@tool
def book_meeting(context: str) -> dict[str, Any]:
    """Surface a "Book a 30-minute call" CTA in the chat.

    Call this when the visitor:
      - mentions a concrete project, mission, or role,
      - explicitly asks how to reach Vincent / book a call, or
      - has answered the qualification question and is a plausible fit.

    Do NOT call it on every turn. Once is enough per conversation; if the
    user already saw the CTA, prefer answering further questions in text.

    Args:
        context: Short single-sentence justification shown to the agent log
            (not to the user). E.g. ``"visitor described a senior RAG
            mission, fits availability"``.

    Returns:
        A serializable dict transported as the ``data-book-meeting`` chunk:
        ``{"type": "book_meeting", "url": "https://cal.eu/...", "context": "..."}``.
    """
    settings = get_settings()
    return {
        "type": "book_meeting",
        "url": settings.calcom_booking_url,
        "context": context.strip(),
    }
