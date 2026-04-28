"""``get_cv`` LangChain tool — single entry point for the agent into the CV.

The tool returns serializable dicts (not Pydantic models) so the LLM sees stable
JSON. Three scopes:

- ``compact`` — only structured fields + blurb. Cheap, ~200 tokens. Good
  default first call.
- ``full`` — everything, including narrative, anecdotes, achievements,
  outcomes, lessons, context.
- ``by_keyword`` — full entries filtered by keyword (matched against
  ``keywords[]``, ``stack[]``, ``title``, ``company``, ``name``).

The shape is identical across scopes (timeline / projects / education / skills
/ preferences) so the agent can reason about it without branching.
"""

from __future__ import annotations

from typing import Any, Literal

from langchain_core.tools import tool

from src.content_loader import (
    CvBundle,
    EducationEntry,
    ProjectEntry,
    SkillEntry,
    TimelineEntry,
    load_bundle,
)

Scope = Literal["compact", "full", "by_keyword"]


# ── Compact projections ──────────────────────────────────────────────────────


def _timeline_compact(e: TimelineEntry) -> dict[str, Any]:
    return {
        "period": e.period,
        "title": e.title,
        "company": e.company,
        "blurb": e.blurb,
    }


def _project_compact(e: ProjectEntry) -> dict[str, Any]:
    return {
        "key": e.key,
        "title": e.title,
        "blurb": e.blurb,
        "stack": e.stack,
        "href": e.href,
    }


def _education_compact(e: EducationEntry) -> dict[str, Any]:
    return {
        "year": e.year,
        "institution": e.institution,
        "title": e.title,
        "blurb": e.blurb,
    }


def _skill_compact(e: SkillEntry) -> dict[str, Any]:
    return {"group": e.group, "name": e.name, "level": e.level}


# ── Full projections (Pydantic dump, drop None for token economy) ────────────


def _dump_full(model: TimelineEntry | ProjectEntry | EducationEntry | SkillEntry) -> dict[str, Any]:
    return model.model_dump(exclude_none=True)


# ── Keyword matching ─────────────────────────────────────────────────────────


def _haystack(*parts: str | list[str] | None) -> str:
    chunks: list[str] = []
    for p in parts:
        if p is None:
            continue
        if isinstance(p, list):
            chunks.extend(p)
        else:
            chunks.append(p)
    return " · ".join(chunks).lower()


def _matches_timeline(e: TimelineEntry, kw: str) -> bool:
    return kw in _haystack(e.title, e.company, e.blurb, e.keywords, e.stack)


def _matches_project(e: ProjectEntry, kw: str) -> bool:
    return kw in _haystack(e.key, e.title, e.blurb, e.keywords, e.stack)


def _matches_skill(e: SkillEntry, kw: str) -> bool:
    return kw in _haystack(e.group, e.name, e.evidence_project_keys, e.story)


def _matches_education(e: EducationEntry, kw: str) -> bool:
    return kw in _haystack(e.institution, e.title, e.blurb, e.highlights)


# ── Bundle → response ────────────────────────────────────────────────────────


def _build_response(bundle: CvBundle, scope: Scope, keyword: str | None) -> dict[str, Any]:
    if scope == "compact":
        return {
            "locale": bundle.locale,
            "scope": "compact",
            "timeline": [_timeline_compact(e) for e in bundle.timeline],
            "projects": [_project_compact(e) for e in bundle.projects],
            "education": [_education_compact(e) for e in bundle.education],
            "skills": [_skill_compact(e) for e in bundle.skills],
            "preferences": (
                bundle.preferences.model_dump(exclude_none=True) if bundle.preferences else None
            ),
        }

    if scope == "full":
        return {
            "locale": bundle.locale,
            "scope": "full",
            "timeline": [_dump_full(e) for e in bundle.timeline],
            "projects": [_dump_full(e) for e in bundle.projects],
            "education": [_dump_full(e) for e in bundle.education],
            "skills": [_dump_full(e) for e in bundle.skills],
            "preferences": (
                bundle.preferences.model_dump(exclude_none=True) if bundle.preferences else None
            ),
        }

    # by_keyword
    if not keyword or not keyword.strip():
        raise ValueError("scope='by_keyword' requires a non-empty keyword")
    kw = keyword.strip().lower()
    return {
        "locale": bundle.locale,
        "scope": "by_keyword",
        "keyword": kw,
        "timeline": [_dump_full(e) for e in bundle.timeline if _matches_timeline(e, kw)],
        "projects": [_dump_full(e) for e in bundle.projects if _matches_project(e, kw)],
        "education": [_dump_full(e) for e in bundle.education if _matches_education(e, kw)],
        "skills": [_dump_full(e) for e in bundle.skills if _matches_skill(e, kw)],
    }


# ── Public callable (used directly in tests / agent code) ────────────────────


def get_cv_payload(
    scope: Scope = "compact",
    keyword: str | None = None,
    locale: str = "en",
) -> dict[str, Any]:
    """Plain (non-tool) callable returning the same payload as the LangChain tool."""
    if scope not in ("compact", "full", "by_keyword"):
        raise ValueError(f"invalid scope: {scope!r}")
    bundle = load_bundle(locale)
    return _build_response(bundle, scope, keyword)


# ── LangChain tool ───────────────────────────────────────────────────────────


@tool
def get_cv(
    scope: Scope = "compact",
    keyword: str | None = None,
    locale: str = "en",
) -> dict[str, Any]:
    """Return Vincent's CV.

    Args:
        scope: "compact" for blurbs only (cheap, ~200 tokens, good default first call);
            "full" for everything including narrative + anecdotes + achievements;
            "by_keyword" returns full entries filtered by keyword (matched against
            keywords[], stack[], title, company, skill name).
        keyword: only used with scope="by_keyword". Case-insensitive substring match.
            Examples: "rag", "iso-42001", "founder", "phoenix".
        locale: "en" or "fr". Defaults to "en".

    Returns:
        A dict with keys ``timeline``, ``projects``, ``education``, ``skills`` and,
        for compact/full scopes, ``preferences``. Each list element is a flat dict.
    """
    return get_cv_payload(scope=scope, keyword=keyword, locale=locale)
