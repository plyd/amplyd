"""CvView — the structured payload the agent emits to re-organize the page.

Schema mirrors apps/web/lib/cvView.ts. The agent picks indices into existing
JSON arrays (timeline) or keys into existing entries (projects). It never
writes new prose: the page re-uses textually whatever the user already wrote
in the source files. That guarantees no hallucinated CV.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TimelineOverlay(_Strict):
    idx: int = Field(ge=0)
    pinned: bool | None = None
    expand: bool | None = None
    show_anecdotes: list[int] | None = None
    show_achievements: list[int] | None = None


class ProjectOverlay(_Strict):
    key: str = Field(min_length=1)
    pinned: bool | None = None
    expand: bool | None = None
    show_anecdotes: list[int] | None = None
    show_outcomes: list[int] | None = None
    show_lessons: list[int] | None = None


class CvView(_Strict):
    reason: str = Field(min_length=1, max_length=280)
    timeline: list[TimelineOverlay] = Field(default_factory=list)
    projects: list[ProjectOverlay] = Field(default_factory=list)
    hidden_keys: list[str] | None = None
    skills_pinned: list[str] | None = None

    def to_data_part(self) -> dict[str, Any]:
        """Serialize for transport over the streaming chat protocol."""
        return self.model_dump(exclude_none=True)
