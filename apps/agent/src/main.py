"""FastAPI entrypoint for the amplyd agent.

Exposes:

  GET  /health   - liveness probe (Cloud Run uses this)
  POST /chat     - SSE stream of AI SDK v6 UI message chunks (text-start /
                   text-delta / text-end / data-cv-view).

Auth: when ``AGENT_API_TOKEN`` is set, /chat requires the matching value in
``Authorization: Bearer <token>``. Health stays public for Cloud Run probes.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.agent import run_agent_stream
from src.settings import get_settings

logger = logging.getLogger("amplyd.agent")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    locale: Literal["en", "fr"] = "en"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    logger.info("amplyd-agent starting (env=%s)", settings.environment)
    yield
    logger.info("amplyd-agent shutting down")


def _check_token(authorization: str | None) -> None:
    expected = get_settings().agent_api_token
    if not expected:
        return  # auth disabled (local dev)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing_token")
    if authorization.removeprefix("Bearer ").strip() != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token")


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
    async def chat(
        req: ChatRequest,
        authorization: str | None = Header(default=None),
    ) -> StreamingResponse:
        _check_token(authorization)

        async def generator() -> AsyncIterator[str]:
            try:
                async for chunk in run_agent_stream(
                    [m.model_dump() for m in req.messages],
                    locale=req.locale,
                ):
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
            except Exception as exc:
                logger.exception("agent stream failed")
                yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
            yield 'data: {"type":"done"}\n\n'

        return StreamingResponse(generator(), media_type="text/event-stream")

    return app


app = create_app()
