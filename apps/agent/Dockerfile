# syntax=docker/dockerfile:1.7

# --- Builder stage: resolve & install deps with uv ---
FROM ghcr.io/astral-sh/uv:0.6.3-python3.12-bookworm-slim AS builder

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Install dependencies first (better layer caching)
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev || uv sync --no-install-project --no-dev

# Now copy app source and install the project
COPY src ./src
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev || uv sync --no-dev

# --- Runtime stage: distroless Python ---
FROM gcr.io/distroless/python3-debian12:nonroot

WORKDIR /app

# Bring in the resolved venv and source
COPY --from=builder --chown=nonroot:nonroot /app/.venv /app/.venv
COPY --from=builder --chown=nonroot:nonroot /app/src /app/src

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PORT=8080

EXPOSE 8080
USER nonroot

ENTRYPOINT ["/app/.venv/bin/python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
