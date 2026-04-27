# amplyd-agent

LangGraph + FastAPI agent that powers the chat on amplyd.com. Deployed on
GCP Cloud Run (eu-west1).

## Local dev

```bash
# Python 3.12 toolchain via uv
uv sync
cp .env.example .env
uv run uvicorn src.main:app --reload --port 8080
```

Smoke check:

```bash
curl localhost:8080/health
curl -N -X POST localhost:8080/chat \
  -H "content-type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}],"locale":"en"}'
```

## Quality gates

```bash
uv run ruff check .
uv run mypy src
uv run pytest --cov
```

CI requires coverage ≥ 70% (`pyproject.toml::tool.coverage.report.fail_under`).

## Build the container

```bash
docker build -t amplyd-agent:dev .
docker run --rm -p 8080:8080 --env-file .env amplyd-agent:dev
```

## Roadmap to a real agent

- M4: StateGraph (route → retrieve → reason → tool → respond), BM25 over MDX,
  `search_profile` and `request_intro` tools, guardrails, LangFuse, litellm.
- M6: `match_offer`, `qualify_lead`, `reveal_phone`, `book_meeting` with
  streaming UI components rendered by the web client.
- M8: public `/mcp` endpoint exposing the profile in MCP spec (read-only).
