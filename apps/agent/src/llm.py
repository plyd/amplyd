"""Chat-model factory.

Returns either a real ``ChatAnthropic`` instance (prod / staging) or a
``FakeListChatModel`` driven by ``AMPLYD_AGENT_FAKE_LLM_RESPONSES`` (tests,
local smoke runs without an API key). Keeping the factory in its own module
makes it trivial to monkeypatch from tests without touching the agent loop.
"""

from __future__ import annotations

import json
import os

from langchain_core.language_models import BaseChatModel
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from src.settings import get_settings


def _strip_provider_prefix(model: str) -> str:
    """``"anthropic/claude-sonnet-4-5"`` -> ``"claude-sonnet-4-5"``.

    litellm-style prefixes are convenient for routing but ChatAnthropic wants
    the bare model id.
    """
    return model.split("/", 1)[1] if "/" in model else model


def get_chat_model() -> BaseChatModel:
    """Return the chat model the agent should use.

    Selection rules:
      1. ``AMPLYD_AGENT_FAKE_LLM_RESPONSES`` is set (JSON list of strings):
         use ``FakeListChatModel`` with those responses.
      2. Otherwise return ``ChatAnthropic`` with the model from settings.
         Raises if no API key is configured — better to fail at startup than
         silently fall back to a fake model in prod.
    """
    fake_env = os.getenv("AMPLYD_AGENT_FAKE_LLM_RESPONSES")
    if fake_env:
        responses = json.loads(fake_env)
        if not isinstance(responses, list) or not all(isinstance(r, str) for r in responses):
            raise ValueError("AMPLYD_AGENT_FAKE_LLM_RESPONSES must be a JSON list of strings")
        return FakeListChatModel(responses=responses)

    settings = get_settings()
    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Set AMPLYD_AGENT_FAKE_LLM_RESPONSES "
            "for test/dev runs without an API key."
        )

    # Imported lazily so test runs that use FakeListChatModel don't pay the
    # langchain-anthropic import cost (and don't need the anthropic SDK on the
    # python path).
    from langchain_anthropic import ChatAnthropic
    from pydantic import SecretStr

    return ChatAnthropic(
        model_name=_strip_provider_prefix(settings.default_llm_model),
        api_key=SecretStr(settings.anthropic_api_key),
        timeout=30,
        stop=None,
    )
