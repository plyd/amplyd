"""Tests for the compose_cv_view LangChain tool."""

from __future__ import annotations

import pytest

from src.tools.compose_cv_view import compose_cv_view


def _invoke(**kwargs: object) -> dict[str, object]:
    """Invoke the LangChain tool through its ``.invoke`` interface so we hit
    the same code path the agent will at runtime."""
    return compose_cv_view.invoke(kwargs)


def test_minimal_payload_round_trips() -> None:
    out = _invoke(reason="why")
    assert out == {"reason": "why", "timeline": [], "projects": []}


def test_full_payload_preserves_overlays() -> None:
    out = _invoke(
        reason="RAG senior",
        timeline=[
            {
                "idx": 0,
                "pinned": True,
                "expand": True,
                "show_anecdotes": [0, 1],
            }
        ],
        projects=[
            {"key": "amplyd", "pinned": True, "expand": True, "show_outcomes": [0]}
        ],
        hidden_keys=["timeline:8"],
        skills_pinned=["LangGraph"],
    )

    assert out["reason"] == "RAG senior"
    assert out["timeline"] == [
        {"idx": 0, "pinned": True, "expand": True, "show_anecdotes": [0, 1]}
    ]
    assert out["projects"] == [
        {"key": "amplyd", "pinned": True, "expand": True, "show_outcomes": [0]}
    ]
    assert out["hidden_keys"] == ["timeline:8"]
    assert out["skills_pinned"] == ["LangGraph"]


def test_strips_none_overlay_fields() -> None:
    """exclude_none must drop optional fields the agent didn't set."""
    out = _invoke(
        reason="why",
        timeline=[{"idx": 0, "pinned": True}],
    )
    assert out["timeline"] == [{"idx": 0, "pinned": True}]
    # `expand`, `show_anecdotes`, `show_achievements` were never set: gone.
    entry = out["timeline"][0]
    assert "expand" not in entry
    assert "show_anecdotes" not in entry


def test_empty_reason_is_rejected() -> None:
    with pytest.raises(ValueError, match="CvView validation failed"):
        _invoke(reason="")


def test_reason_too_long_is_rejected() -> None:
    with pytest.raises(ValueError, match="CvView validation failed"):
        _invoke(reason="a" * 281)


def test_negative_idx_is_rejected() -> None:
    with pytest.raises(ValueError, match="CvView validation failed"):
        _invoke(reason="why", timeline=[{"idx": -1}])


def test_empty_project_key_is_rejected() -> None:
    with pytest.raises(ValueError, match="CvView validation failed"):
        _invoke(reason="why", projects=[{"key": ""}])


def test_unknown_overlay_field_is_rejected() -> None:
    """The schema is strict (extra='forbid'): typos shouldn't slip through."""
    with pytest.raises(ValueError, match="CvView validation failed"):
        _invoke(reason="why", timeline=[{"idx": 0, "pin": True}])
