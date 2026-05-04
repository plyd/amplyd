"""Agent loop — streams AI SDK v6 UI message chunks over SSE.

Manual loop (no ``create_react_agent``) so we keep tight control over what we
yield to the wire: the page consumes the same chunk shape that the placeholder
``/api/chat`` route emits today (``text-start`` / ``text-delta`` / ``text-end``
/ ``data-cv-view``), so swapping the proxy in does not require touching the
front-end.

Emission rules:
  * One ``text-start``/``text-delta``*/``text-end`` block per assistant turn.
  * Each call to ``compose_cv_view`` emits one ``data-cv-view`` chunk with the
    validated payload right after the corresponding tool message lands.
  * The loop bails out after ``MAX_TOOL_ITERATIONS`` to keep run-away tool
    chains from holding a Cloud Run instance hostage.

The system prompt is intentionally short — heavy CV context comes through the
``get_cv`` tool on demand, so we don't waste tokens on every turn.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from typing import Any, Literal
from uuid import uuid4

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.runnables import Runnable

from src.llm import get_chat_model
from src.tools.book_meeting import book_meeting
from src.tools.compose_cv_view import compose_cv_view
from src.tools.cv_tools import get_cv
from src.tools.notify_vincent import notify_vincent

logger = logging.getLogger("amplyd.agent.loop")

MAX_TOOL_ITERATIONS = 6

TOOLS = [get_cv, compose_cv_view, book_meeting, notify_vincent]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}


def _bind_tools(model: BaseChatModel) -> Runnable[Any, Any] | BaseChatModel:
    """Bind the agent tools, gracefully degrading when the model doesn't
    support tool calling (e.g. ``FakeListChatModel`` in tests)."""
    try:
        return model.bind_tools(TOOLS)
    except NotImplementedError:
        logger.debug("model %s does not support bind_tools; running text-only", type(model).__name__)
        return model


def _system_prompt(locale: Literal["en", "fr"]) -> str:
    base = (
        "You are the AI assistant on amplyd.com — Vincent Juhel's site. "
        "Vincent is a Senior AI Architect (20 years XP, INSA + HEC + MIT) "
        "who ships agentic systems, RAG, multi-LLM routing, and ISO/IEC "
        "42001 governance for clients. Your job is NOT to recite his CV — "
        "it is to help the visitor solve their problem and show, with one "
        "concrete proof point, that Vincent can deliver.\n\n"
        "Posture (read this twice):\n"
        "- Lead with the problem, not the resume. If the visitor asks "
        "'can he do X?', the answer is 'yes — here's how he'd approach it' "
        "followed by ONE specific past project that maps to it.\n"
        "- Confident verbs: 'designs', 'ships', 'has shipped', 'led'. Avoid "
        "hedging ('might', 'probably could'). If you're unsure, call get_cv "
        "first; never invent.\n"
        "- One proof point per answer is enough. Quality > quantity. The "
        "goal is a conversation, not a wall of credentials.\n"
        "- You speak FOR Vincent, not ABOUT him. 'I' is fine when it makes "
        "the reply natural; if you do, stay accurate to the CV.\n\n"
        "Tools:\n"
        "- get_cv(scope, keyword?, locale): pull Vincent's CV. Start with "
        "scope='compact' to learn the structure cheaply, then call "
        "scope='by_keyword' (e.g. keyword='rag') or scope='full' when you "
        "need long-form anecdotes / achievements to back a claim.\n"
        "- compose_cv_view(reason, timeline?, projects?, hidden_keys?, "
        "skills_pinned?): re-organize the page. Pin the entries that match "
        "the visitor's interest, expand them, surface the most relevant "
        "anecdote/achievement indices. NEVER invent text — only point at "
        "indices/keys you have seen in get_cv. The 'reason' is a short "
        "single-sentence banner shown above the CV.\n"
        "- book_meeting(context): surface a Cal.com booking CTA inline in "
        "the chat. Use it ONCE per conversation, after delivering value, "
        "when the visitor mentions a concrete project, asks for a contact, "
        "or has answered the qualification question and is a plausible fit.\n"
        "- notify_vincent(summary, intent_signal, transcript_excerpts?, "
        "locale?): email Vincent a brief on this lead. Use it AT MOST ONCE "
        "per conversation, only when you have enough signal for a useful "
        "summary (~3-5 sentences). Skip it for casual / curious chatter. "
        "Good triggers: concrete need + plausible context, post-booking "
        "warm-up, or explicit request to be contacted.\n\n"
        "Conversion behavior (light, never pushy):\n"
        "1. Answer first. Value before any ask.\n"
        "2. After a substantive reply, you may slip in AT MOST ONE natural "
        "qualifying question among: type of project, timeline, team size, "
        "freelance vs CDI. Never stack questions, never interrogate.\n"
        "3. On strong intent (concrete project, asks how to reach Vincent, "
        "requests a call) → call book_meeting() with a one-sentence "
        "context, then stop pushing.\n"
        "4. When the lead is qualified (typically after book_meeting, or "
        "after the visitor describes a real need with enough context to "
        "brief Vincent) → call notify_vincent() once, with a 3-5 sentence "
        "summary.\n"
        "5. NEVER ask for email or phone — Cal.com handles that. NEVER "
        "quote a daily rate (TJM)."
    )
    if locale == "fr":
        base += "\n\nReply in French unless the visitor writes in another language."
    else:
        base += "\n\nReply in English unless the visitor writes in another language."
    return base


def _to_lc_messages(
    messages: list[dict[str, str]],
    locale: Literal["en", "fr"],
) -> list[BaseMessage]:
    out: list[BaseMessage] = [SystemMessage(content=_system_prompt(locale))]
    for m in messages:
        role = m["role"]
        content = m["content"]
        if role == "user":
            out.append(HumanMessage(content=content))
        elif role == "assistant":
            out.append(AIMessage(content=content))
        elif role == "system":
            # Visitor-supplied system messages are ignored; we already pinned
            # ours above.
            continue
    return out


def _chunk_text(chunk: AIMessageChunk | BaseMessage) -> str:
    """Best-effort extraction of streamed delta text.

    LangChain returns ``content`` as either a plain string or a list of
    typed blocks (``{"type": "text", "text": "..."}``). We only care about
    the text portion here — tool calls land in the final aggregated
    ``AIMessage`` and are handled separately.
    """
    content = chunk.content
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return ""


async def run_agent_stream(
    messages: list[dict[str, str]],
    locale: Literal["en", "fr"] = "en",
) -> AsyncIterator[dict[str, Any]]:
    """Yield AI SDK v6 UI message chunks for one /chat call.

    Args:
        messages: ordered chat history. Each item is ``{"role": str,
            "content": str}``.
        locale: ``"en"`` or ``"fr"`` — used both for the system prompt and
            forwarded to the ``get_cv`` tool by the model when relevant.

    Yields:
        Dicts ready to be JSON-serialized into SSE ``data:`` lines. See the
        module docstring for the chunk shape contract.
    """
    model = _bind_tools(get_chat_model())
    state: list[BaseMessage] = _to_lc_messages(messages, locale)

    for _ in range(MAX_TOOL_ITERATIONS):
        text_id = uuid4().hex
        yield {"type": "text-start", "id": text_id}

        aggregated: AIMessageChunk | None = None
        async for chunk in model.astream(state):
            delta = _chunk_text(chunk)
            if delta:
                yield {"type": "text-delta", "id": text_id, "delta": delta}
            if aggregated is None:
                aggregated = chunk if isinstance(chunk, AIMessageChunk) else None
            elif isinstance(chunk, AIMessageChunk):
                aggregated = aggregated + chunk

        yield {"type": "text-end", "id": text_id}

        if aggregated is None:
            # No content streamed at all — stop the loop to avoid burning tokens.
            return

        # The aggregated AIMessageChunk carries the tool_calls list once the
        # stream is closed. Convert to a real AIMessage before appending to
        # the conversation state.
        ai_msg = AIMessage(
            content=aggregated.content,
            tool_calls=getattr(aggregated, "tool_calls", []),
            additional_kwargs=aggregated.additional_kwargs,
        )
        state.append(ai_msg)

        if not ai_msg.tool_calls:
            return

        for call in ai_msg.tool_calls:
            name = call["name"]
            tool = TOOLS_BY_NAME.get(name)
            if tool is None:
                # Unknown tool — surface to the model so it can recover.
                state.append(
                    ToolMessage(
                        content=f"Unknown tool: {name}",
                        tool_call_id=call["id"],
                        name=name,
                    )
                )
                continue

            try:
                result = await tool.ainvoke(call["args"])
            except Exception as exc:
                logger.warning("tool %s failed: %s", name, exc)
                state.append(
                    ToolMessage(
                        content=f"Tool error: {exc}",
                        tool_call_id=call["id"],
                        name=name,
                    )
                )
                continue

            state.append(
                ToolMessage(
                    content=str(result),
                    tool_call_id=call["id"],
                    name=name,
                )
            )

            if name == "compose_cv_view" and isinstance(result, dict):
                yield {"type": "data-cv-view", "data": result}
            elif name == "book_meeting" and isinstance(result, dict):
                yield {"type": "data-book-meeting", "data": result}

    logger.info("hit MAX_TOOL_ITERATIONS=%d, returning", MAX_TOOL_ITERATIONS)
