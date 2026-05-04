"""``notify_vincent`` LangChain tool — email a qualified-lead summary to Vincent.

The agent calls this **at most once per conversation**, after enough signal has
been gathered to write a useful one-paragraph brief: who the visitor is, what
they need, the rough scope, and (optionally) a couple of verbatim quotes.

The tool intentionally returns a tiny acknowledgement string for the LLM; the
front-end does not render anything for this call (no data part). The visitor
sees only Vincent's natural follow-up via the chat — the email is a
behind-the-scenes signal so Vincent can decide to reach out personally.
"""

from __future__ import annotations

from langchain_core.tools import tool

from src.email_sender import send_lead_notification


@tool
def notify_vincent(
    summary: str,
    intent_signal: str,
    transcript_excerpts: list[str] | None = None,
    locale: str = "en",
) -> str:
    """Send Vincent an email with a qualified-lead summary.

    Call this AT MOST ONCE per conversation, only when you have enough signal
    to write a useful brief (~3-5 sentences). Skip it for casual browsing,
    pure curiosity, or visibly low-intent chatter.

    Good triggers:
      - The visitor described a concrete need (mission, role, project) and a
        plausible context (team, timeline).
      - The visitor used ``book_meeting`` and you want Vincent prepped before
        the call.
      - The visitor explicitly asked Vincent to be informed / contacted.

    Args:
        summary: 3-5 sentences in plain text. Cover: who the visitor seems to
            be (role / company hints), what they're looking for, scope or
            timeline if known, and your read on fit.
        intent_signal: Short tag describing why you're sending. Examples:
            ``"freelance-mission"``, ``"cdi-role"``, ``"post-booking"``,
            ``"explicit-request"``.
        transcript_excerpts: Optional verbatim quotes worth showing Vincent
            (max 3, each one sentence-ish). Skip if nothing memorable.
        locale: ``"en"`` or ``"fr"`` — the language the visitor used.

    Returns:
        Short status string for your own log. Do not surface it to the user.
    """
    subject = f"[amplyd lead] {intent_signal}".strip()
    sent = send_lead_notification(
        subject=subject,
        summary=summary,
        transcript_excerpts=transcript_excerpts,
        locale=locale,
    )
    return "notified" if sent else "notify-skipped"
