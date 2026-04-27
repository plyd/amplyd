"""Pydantic-settings module loaded once at startup."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Service-wide settings. Values come from env vars (or .env in dev).

    Secrets in prod are mounted via GCP Secret Manager. Never log these.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Service ---
    port: int = 8080
    log_level: str = "INFO"
    environment: str = "local"

    # --- LLM providers ---
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    default_llm_model: str = "anthropic/claude-sonnet-4-5"
    fallback_llm_models: str = "openai/gpt-5,gemini/gemini-2.5-flash"

    # --- LangFuse ---
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_host: str = "https://cloud.langfuse.com"

    # --- Resend ---
    resend_api_key: str | None = None
    resend_from_email: str = "hello@amplyd.com"
    owner_email: str = ""  # injected via env / Secret Manager — never commit a real value

    # --- Owner contact ---
    owner_phone: str | None = None

    # --- Corpus ---
    content_dir: str = "../web/content"

    # --- Security ---
    allowed_origins: str = "http://localhost:3000"
    agent_api_token: str | None = None

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def fallback_models_list(self) -> list[str]:
        return [m.strip() for m in self.fallback_llm_models.split(",") if m.strip()]


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
