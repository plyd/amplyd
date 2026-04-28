"""Read the gitted CV content (JSON) from disk and return validated dataclasses.

The web app owns the canonical schema (see apps/web/lib/content.ts). This module
mirrors it in Pydantic so the agent can consume the same files without going
through HTTP. Files live under settings.content_dir; missing files are tolerated
(empty list / None) so the agent boots even on a fork with placeholder content.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict

from src.settings import get_settings

logger = logging.getLogger("amplyd.agent.content")

LOCALES = ("en", "fr")
SkillGroup = Literal["agents", "rag", "routing", "governance", "platform", "languages"]
SkillLevel = Literal["exposure", "working", "expert"]
RemoteMode = Literal["full", "hybrid", "onsite"]
ContractType = Literal["freelance", "cdi"]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class TimelineEntry(_Strict):
    period: str
    title: str
    company: str
    blurb: str
    narrative: str | None = None
    anecdotes: list[str] | None = None
    achievements: list[str] | None = None
    outcomes: list[str] | None = None
    lessons: list[str] | None = None
    stack: list[str] | None = None
    keywords: list[str] | None = None
    context: str | None = None


class ProjectEntry(_Strict):
    key: str
    title: str
    blurb: str
    href: str | None = None
    stack: list[str]
    narrative: str | None = None
    anecdotes: list[str] | None = None
    outcomes: list[str] | None = None
    lessons: list[str] | None = None
    keywords: list[str] | None = None
    context: str | None = None


class EducationEntry(_Strict):
    year: str
    institution: str
    title: str
    blurb: str
    narrative: str | None = None
    why: str | None = None
    highlights: list[str] | None = None


class SkillEntry(_Strict):
    group: SkillGroup
    name: str
    level: SkillLevel | None = None
    years_xp: float | None = None
    evidence_project_keys: list[str] | None = None
    story: str | None = None


class Preferences(_Strict):
    remote: RemoteMode
    locations: list[str]
    availability: str | None = None
    contract_types: list[ContractType]
    sectors_of_interest: list[str] | None = None
    values: str | None = None
    red_flags: list[str] | None = None


class CvBundle(_Strict):
    locale: str
    timeline: list[TimelineEntry]
    projects: list[ProjectEntry]
    education: list[EducationEntry]
    skills: list[SkillEntry]
    preferences: Preferences | None


def _content_root() -> Path:
    """Resolve content_dir against the agent package, not CWD.

    The default ``../web/content`` is relative to ``apps/agent``; if a deployer
    sets an absolute path via env, we honor it as-is.
    """
    raw = get_settings().content_dir
    p = Path(raw)
    if p.is_absolute():
        return p
    # apps/agent/src/content_loader.py → apps/agent → resolve relative path
    return (Path(__file__).resolve().parent.parent / p).resolve()


def _read_json(path: Path) -> object | None:
    try:
        with path.open("r", encoding="utf-8") as fh:
            data: object = json.load(fh)
            return data
    except FileNotFoundError:
        logger.info("content file missing, skipping: %s", path)
        return None
    except json.JSONDecodeError as exc:
        logger.error("content file invalid JSON: %s (%s)", path, exc)
        return None


def _load_array[T: _Strict](path: Path, model: type[T]) -> list[T]:
    raw = _read_json(path)
    if raw is None:
        return []
    if not isinstance(raw, list):
        logger.error("expected a JSON array in %s, got %s", path, type(raw).__name__)
        return []
    out: list[T] = []
    for idx, item in enumerate(raw):
        try:
            out.append(model.model_validate(item))
        except Exception as exc:
            logger.error("invalid %s entry at %s[%d]: %s", model.__name__, path, idx, exc)
    return out


def _load_preferences(path: Path) -> Preferences | None:
    raw = _read_json(path)
    if raw is None:
        return None
    try:
        return Preferences.model_validate(raw)
    except Exception as exc:
        logger.error("invalid Preferences entry in %s: %s", path, exc)
        return None


@lru_cache(maxsize=8)
def load_bundle(locale: str) -> CvBundle:
    """Load all CV content for a locale. Cached per-process; missing files yield empty lists."""
    if locale not in LOCALES:
        raise ValueError(f"unsupported locale: {locale!r} (expected one of {LOCALES})")
    root = _content_root()
    return CvBundle(
        locale=locale,
        timeline=_load_array(root / f"timeline.{locale}.json", TimelineEntry),
        projects=_load_array(root / f"projects.{locale}.json", ProjectEntry),
        education=_load_array(root / f"education.{locale}.json", EducationEntry),
        skills=_load_array(root / f"skills.{locale}.json", SkillEntry),
        preferences=_load_preferences(root / f"preferences.{locale}.json"),
    )


def reset_cache() -> None:
    """Drop the load_bundle LRU cache. Useful for tests and hot-reload paths."""
    load_bundle.cache_clear()
