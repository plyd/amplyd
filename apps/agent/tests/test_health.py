"""Smoke tests for the FastAPI app."""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from src.main import create_app


def test_health() -> None:
    app = create_app()
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "version": "0.1.0"}


def test_chat_streams_with_fake_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    """Drive the real /chat endpoint with a deterministic fake LLM."""
    monkeypatch.setenv("AMPLYD_AGENT_FAKE_LLM_RESPONSES", json.dumps(["Hi from fake."]))

    app = create_app()
    client = TestClient(app)
    with client.stream(
        "POST",
        "/chat",
        json={
            "messages": [{"role": "user", "content": "Hello"}],
            "locale": "en",
        },
    ) as r:
        assert r.status_code == 200
        body = b"".join(r.iter_bytes()).decode()

    assert "text-start" in body
    # Fake model streams char-by-char; reassemble the deltas to match.
    deltas: list[str] = []
    for line in body.splitlines():
        if not line.startswith("data: "):
            continue
        try:
            obj = json.loads(line.removeprefix("data: "))
        except json.JSONDecodeError:
            continue
        if obj.get("type") == "text-delta":
            deltas.append(obj["delta"])
    assert "".join(deltas) == "Hi from fake."
    assert '"type":"done"' in body


def test_chat_rejects_overlong_content() -> None:
    app = create_app()
    client = TestClient(app)
    r = client.post(
        "/chat",
        json={"messages": [{"role": "user", "content": "x" * 4001}], "locale": "en"},
    )
    assert r.status_code == 422


def test_chat_requires_token_when_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AGENT_API_TOKEN", "secret-123")
    monkeypatch.setenv("AMPLYD_AGENT_FAKE_LLM_RESPONSES", json.dumps(["ok"]))
    # Force settings to re-read the env we just patched.
    import src.settings as settings_mod

    settings_mod._settings = None

    app = create_app()
    client = TestClient(app)

    # Missing token → 401.
    r = client.post(
        "/chat",
        json={"messages": [{"role": "user", "content": "Hello"}], "locale": "en"},
    )
    assert r.status_code == 401

    # Wrong token → 401.
    r = client.post(
        "/chat",
        headers={"Authorization": "Bearer nope"},
        json={"messages": [{"role": "user", "content": "Hello"}], "locale": "en"},
    )
    assert r.status_code == 401

    # Correct token → 200.
    with client.stream(
        "POST",
        "/chat",
        headers={"Authorization": "Bearer secret-123"},
        json={"messages": [{"role": "user", "content": "Hello"}], "locale": "en"},
    ) as r:
        assert r.status_code == 200

    # Reset for other tests.
    settings_mod._settings = None
