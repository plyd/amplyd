"""Smoke tests for the FastAPI app."""

from __future__ import annotations

from fastapi.testclient import TestClient

from src.main import create_app


def test_health() -> None:
    app = create_app()
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "version": "0.1.0"}


def test_chat_stub_streams() -> None:
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
    assert "Vincent's AI agent" in body
    assert '"type":"done"' in body


def test_chat_rejects_overlong_content() -> None:
    app = create_app()
    client = TestClient(app)
    r = client.post(
        "/chat",
        json={"messages": [{"role": "user", "content": "x" * 4001}], "locale": "en"},
    )
    assert r.status_code == 422
