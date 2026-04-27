"""FastAPI entrypoint for the amplyd agent.

The full LangGraph wiring, tools, retrieval, and MCP server are added in
later milestones (M4-M8). For now this provides:

  GET  /health   - liveness probe (Cloud Run uses this)
  POST /chat     - placeholder echo endpoint, returns SSE
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.settings import get_settings

logger = logging.getLogger("amplyd.agent")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    locale: Literal["en", "fr"] = "en"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    logger.info("amplyd-agent starting (env=%s)", settings.environment)
    yield
    logger.info("amplyd-agent shutting down")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="amplyd-agent",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": "0.1.0"}

    @app.post("/chat")
    async def chat(req: ChatRequest) -> StreamingResponse:
        """Placeholder. M4 replaces this with the real LangGraph stream."""

        async def generator() -> AsyncIterator[str]:
            preview = (req.messages[-1].content if req.messages else "")[:80]
            chunks = [
                "Hi - I'm Vincent's AI agent. ",
                "This is a scaffolding stub: ",
                f'you said "{preview}". ',
                "Real reasoning ships at M4.",
            ]
            for c in chunks:
                payload = json.dumps({"type": "text-delta", "delta": c})
                yield f"data: {payload}\n\n"
            yield 'data: {"type":"done"}\n\n'

        return StreamingResponse(generator(), media_type="text/event-stream")

    return app


app = create_app()
