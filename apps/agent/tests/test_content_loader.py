"""Tests for the agent-side content loader (mirrors apps/web/lib/content.ts)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from src import content_loader
from src.content_loader import (
    LOCALES,
    EducationEntry,
    Preferences,
    ProjectEntry,
    SkillEntry,
    TimelineEntry,
    load_bundle,
)


@pytest.fixture(autouse=True)
def _reset_cache() -> None:
    content_loader.reset_cache()


@pytest.mark.parametrize("locale", LOCALES)
def test_load_bundle_parses_real_content(locale: str) -> None:
    """Smoke test: every JSON file under apps/web/content validates against the schema."""
    b = load_bundle(locale)
    assert b.locale == locale
    # The repo ships real CV data; expect non-empty for every list.
    assert b.timeline, "timeline should not be empty"
    assert b.projects, "projects should not be empty"
    assert b.education, "education should not be empty"
    assert b.skills, "skills should not be empty"
    assert isinstance(b.preferences, Preferences)
    # Type sanity.
    assert all(isinstance(e, TimelineEntry) for e in b.timeline)
    assert all(isinstance(e, ProjectEntry) for e in b.projects)
    assert all(isinstance(e, EducationEntry) for e in b.education)
    assert all(isinstance(e, SkillEntry) for e in b.skills)


def test_unknown_locale_raises() -> None:
    with pytest.raises(ValueError, match="unsupported locale"):
        load_bundle("de")


def test_load_bundle_is_cached() -> None:
    a = load_bundle("en")
    b = load_bundle("en")
    assert a is b


def test_amplyd_project_has_rag_keyword() -> None:
    """Anchor: the agent will be matched against this entry in the cv_tools test."""
    b = load_bundle("en")
    amplyd = next((p for p in b.projects if p.key == "amplyd"), None)
    assert amplyd is not None
    assert amplyd.keywords is not None
    assert "rag" in amplyd.keywords


def test_loader_tolerates_missing_files(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Forks with placeholder content shouldn't break the agent."""
    # Pretend content_dir points to an empty tmp directory.
    settings = content_loader.get_settings()
    monkeypatch.setattr(settings, "content_dir", str(tmp_path))
    content_loader.reset_cache()
    b = load_bundle("en")
    assert b.timeline == []
    assert b.projects == []
    assert b.education == []
    assert b.skills == []
    assert b.preferences is None


def test_loader_skips_invalid_entries(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """One bad entry shouldn't poison the whole list."""
    (tmp_path / "projects.en.json").write_text(
        json.dumps(
            [
                {"key": "ok", "title": "Good", "blurb": "fine", "stack": ["Python"]},
                {"title": "missing required key/blurb/stack"},  # invalid
            ]
        ),
        encoding="utf-8",
    )
    settings = content_loader.get_settings()
    monkeypatch.setattr(settings, "content_dir", str(tmp_path))
    content_loader.reset_cache()
    b = load_bundle("en")
    assert len(b.projects) == 1
    assert b.projects[0].key == "ok"
