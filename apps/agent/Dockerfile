# syntax=docker/dockerfile:1.7
#
# Build context: monorepo root (../../ from this file). The agent ships the
# web CV content (apps/web/content) baked in so the get_cv tool has data.

# --- Builder stage: resolve & install deps with uv ---
FROM ghcr.io/astral-sh/uv:0.6.3-python3.12-bookworm-slim AS builder

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Install dependencies first (better layer caching).
# README.md is referenced by pyproject.toml (`readme = "README.md"`) so hatchling
# needs it present even during the deps-only sync.
COPY apps/agent/pyproject.toml apps/agent/uv.lock* apps/agent/README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev || uv sync --no-install-project --no-dev

# Now copy app source and install the project
COPY apps/agent/src ./src
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev || uv sync --no-dev

# --- Runtime stage: python:3.12-slim ---
# Distroless ships python 3.11 on debian-12 — incompatible with our 3.12 venv.
# python:3.12-slim-bookworm is small (~50MB) and matches the builder ABI.
FROM python:3.12-slim-bookworm

# Run as a non-root user
RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app --home-dir /app --shell /sbin/nologin app

WORKDIR /app

COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --from=builder --chown=app:app /app/src /app/src
# Bake the CV content (timeline/projects/education/skills/preferences JSON)
# at /app/content; AMPLYD_AGENT_CONTENT_DIR points the loader at it.
COPY --chown=app:app apps/web/content /app/content

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app" \
    CONTENT_DIR="/app/content" \
    PORT=8080

EXPOSE 8080
USER app

ENTRYPOINT ["/app/.venv/bin/python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
