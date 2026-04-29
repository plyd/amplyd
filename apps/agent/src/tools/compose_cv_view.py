"""``compose_cv_view`` LangChain tool — emit a structured CvView payload.

The agent calls this when it has decided which entries deserve to be pinned /
expanded / hidden after talking to the visitor. It never authors prose: every
field is either a pointer (``idx`` into the timeline array, ``key`` into a
project entry) or a short ``reason`` banner. The page reuses textually what
the user wrote in the JSON sources.

Validation goes through the existing :class:`CvView` Pydantic model so an
agent that emits a malformed payload (negative idx, empty key, reason too
long, etc.) gets a precise ``ValidationError`` it can recover from on the
next turn — instead of silently shipping nonsense to the page.
"""

from __future__ import annotations

from typing import Any

from langchain_core.tools import tool
from pydantic import ValidationError

from src.tools.cv_view import CvView


@tool
def compose_cv_view(
    reason: str,
    timeline: list[dict[str, Any]] | None = None,
    projects: list[dict[str, Any]] | None = None,
    hidden_keys: list[str] | None = None,
    skills_pinned: list[str] | None = None,
) -> dict[str, Any]:
    """Build a CvView payload that the page will use to reorganize itself.

    Args:
        reason: Short italic banner shown above the CV (1-280 chars). Plain
            sentence justifying the reorganization, e.g.
            ``"Vous m'avez parlé de RAG senior, voici ce qui colle."``.
        timeline: Overlays for timeline entries, each ``{"idx": int, "pinned":
            bool?, "expand": bool?, "show_anecdotes": [int]?,
            "show_achievements": [int]?}``.
        projects: Overlays for project entries, each ``{"key": str, "pinned":
            bool?, "expand": bool?, "show_anecdotes": [int]?,
            "show_outcomes": [int]?, "show_lessons": [int]?}``.
        hidden_keys: Entry keys to dim (not delete). Use sparingly.
        skills_pinned: Skill names to surface in accent color.

    Returns:
        A serializable dict suitable for transport over the chat data part
        ``data-cv-view``. Keys with ``None`` values are stripped.

    Raises:
        ValueError: If the resulting payload fails CvView validation; the
            message lists the offending fields so the agent can retry.
    """
    payload: dict[str, Any] = {
        "reason": reason,
        "timeline": timeline or [],
        "projects": projects or [],
    }
    if hidden_keys is not None:
        payload["hidden_keys"] = hidden_keys
    if skills_pinned is not None:
        payload["skills_pinned"] = skills_pinned

    try:
        view = CvView.model_validate(payload)
    except ValidationError as exc:
        # Re-raise as ValueError so LangChain shows it to the agent in a
        # readable form; the agent can then retry on the next turn.
        raise ValueError(f"CvView validation failed: {exc}") from exc

    return view.to_data_part()
