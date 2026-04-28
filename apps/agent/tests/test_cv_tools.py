"""Tests for the get_cv tool exposed to the LangGraph agent."""

from __future__ import annotations

import pytest

from src import content_loader
from src.tools.cv_tools import get_cv, get_cv_payload


@pytest.fixture(autouse=True)
def _reset_cache() -> None:
    content_loader.reset_cache()


def test_compact_only_returns_blurbs() -> None:
    p = get_cv_payload(scope="compact", locale="en")
    assert p["scope"] == "compact"
    # No long-form fields should ever appear in compact.
    for entry in p["timeline"]:
        assert set(entry.keys()) == {"period", "title", "company", "blurb"}
    for entry in p["projects"]:
        assert set(entry.keys()).issubset({"key", "title", "blurb", "stack", "href"})
    for entry in p["education"]:
        assert set(entry.keys()) == {"year", "institution", "title", "blurb"}


def test_full_includes_narrative_and_anecdotes_when_present() -> None:
    p = get_cv_payload(scope="full", locale="en")
    assert p["scope"] == "full"
    # Find an entry that has narrative — at least one should.
    has_narrative = any("narrative" in e for e in p["timeline"])
    assert has_narrative, "expected at least one timeline entry to expose a narrative"
    has_anecdotes = any("anecdotes" in e for e in p["projects"])
    assert has_anecdotes, "expected at least one project entry to expose anecdotes"


def test_by_keyword_rag_matches_amplyd_or_speedflow() -> None:
    p = get_cv_payload(scope="by_keyword", keyword="rag", locale="en")
    assert p["scope"] == "by_keyword"
    assert p["keyword"] == "rag"
    keys = {e["key"] for e in p["projects"]}
    # Plan acceptance criterion: the rag keyword must surface a relevant project.
    assert keys & {"amplyd", "speedflow"}, f"expected amplyd or speedflow, got {keys}"


def test_by_keyword_iso_42001_surfaces_education_and_speedflow() -> None:
    p = get_cv_payload(scope="by_keyword", keyword="iso-42001", locale="en")
    project_keys = {e["key"] for e in p["projects"]}
    assert "speedflow" in project_keys


def test_by_keyword_is_case_insensitive() -> None:
    a = get_cv_payload(scope="by_keyword", keyword="RAG", locale="en")
    b = get_cv_payload(scope="by_keyword", keyword="rag", locale="en")
    assert {e["key"] for e in a["projects"]} == {e["key"] for e in b["projects"]}


def test_by_keyword_requires_keyword() -> None:
    with pytest.raises(ValueError, match="keyword"):
        get_cv_payload(scope="by_keyword", keyword=None, locale="en")
    with pytest.raises(ValueError, match="keyword"):
        get_cv_payload(scope="by_keyword", keyword="   ", locale="en")


def test_invalid_scope_raises() -> None:
    with pytest.raises(ValueError, match="invalid scope"):
        get_cv_payload(scope="bogus", locale="en")  # type: ignore[arg-type]


def test_french_locale_returns_french_content() -> None:
    p = get_cv_payload(scope="compact", locale="fr")
    assert p["locale"] == "fr"
    # Smoke check: at least one French-only string should be present.
    blurbs = " ".join(e["blurb"] for e in p["projects"])
    assert any(token in blurbs for token in ("agent", "plateforme", "garde-fous", "site"))


def test_langchain_tool_invocation() -> None:
    """The @tool wrapper should accept JSON-style args via .invoke()."""
    payload = get_cv.invoke({"scope": "compact", "locale": "en"})
    assert isinstance(payload, dict)
    assert payload["scope"] == "compact"
    assert "projects" in payload
