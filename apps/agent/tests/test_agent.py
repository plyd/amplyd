"""Agent loop tests with a fake chat model.

We avoid hitting any real LLM by injecting a ``FakeListChatModel`` via
``monkeypatch`` on ``src.agent.get_chat_model``. The fake doesn't emit tool
calls (its ``bind_tools`` is a no-op shim), so we only verify the streaming
plumbing — text-start/text-delta/text-end framing, deterministic id, and the
no-tool-call early exit. Tool-call paths are covered separately by
``test_compose_cv_view`` and ``test_cv_tools``.
"""

from __future__ import annotations

from typing import Any

import pytest
from langchain_core.language_models.fake_chat_models import FakeListChatModel

import src.agent as agent_mod


def _make_fake(responses: list[str]) -> FakeListChatModel:
    return FakeListChatModel(responses=responses)


@pytest.mark.asyncio
async def test_streams_text_chunks(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(agent_mod, "get_chat_model", lambda: _make_fake(["Hello, visitor."]))

    chunks: list[dict[str, Any]] = []
    async for c in agent_mod.run_agent_stream(
        [{"role": "user", "content": "Hi"}], locale="en"
    ):
        chunks.append(c)

    types = [c["type"] for c in chunks]
    assert types[0] == "text-start"
    assert "text-delta" in types
    assert types[-1] == "text-end"

    deltas = "".join(c["delta"] for c in chunks if c["type"] == "text-delta")
    assert deltas == "Hello, visitor."

    # Same text-id throughout the run.
    ids = {c["id"] for c in chunks if "id" in c}
    assert len(ids) == 1


@pytest.mark.asyncio
async def test_locale_fr_does_not_crash(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(agent_mod, "get_chat_model", lambda: _make_fake(["Bonjour."]))

    out: list[dict[str, Any]] = []
    async for c in agent_mod.run_agent_stream(
        [{"role": "user", "content": "Salut"}], locale="fr"
    ):
        out.append(c)

    deltas = "".join(c["delta"] for c in out if c["type"] == "text-delta")
    assert deltas == "Bonjour."


def test_notify_vincent_is_registered() -> None:
    """The tool must be wired into the agent's TOOLS list, otherwise the
    LLM cannot call it even with the right system prompt."""
    assert "notify_vincent" in agent_mod.TOOLS_BY_NAME
    assert "book_meeting" in agent_mod.TOOLS_BY_NAME


def test_system_prompt_has_commercial_posture() -> None:
    """Smoke-test the rewrite: prompt must lead with problem-solving, not
    CV recitation, and must mention notify_vincent."""
    prompt = agent_mod._system_prompt("en")
    # Posture markers
    assert "Lead with the problem" in prompt
    assert "proof point" in prompt
    # Tool documented
    assert "notify_vincent" in prompt
    # Hard constraints kept
    assert "NEVER ask for email or phone" in prompt
    assert "TJM" in prompt


def test_system_prompt_locale_switch() -> None:
    en = agent_mod._system_prompt("en")
    fr = agent_mod._system_prompt("fr")
    assert "Reply in English" in en
    assert "Reply in French" in fr


@pytest.mark.asyncio
async def test_no_tool_calls_means_single_turn(monkeypatch: pytest.MonkeyPatch) -> None:
    """The fake model never returns tool_calls, so the loop exits after one turn."""
    monkeypatch.setattr(agent_mod, "get_chat_model", lambda: _make_fake(["one", "two"]))

    chunks: list[dict[str, Any]] = []
    async for c in agent_mod.run_agent_stream(
        [{"role": "user", "content": "Hi"}], locale="en"
    ):
        chunks.append(c)

    # Only one text-end → loop did not iterate twice.
    assert sum(1 for c in chunks if c["type"] == "text-end") == 1
