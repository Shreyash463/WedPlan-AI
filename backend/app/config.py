"""Application configuration settings using pydantic-settings.

Provides strongly typed settings with cached injection via `get_settings()`
for use in FastAPI endpoints and domain services.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root .env auto-discovery for local runs and tests
ROOT_DIR = Path(__file__).resolve().parents[2]
env_file = ROOT_DIR / ".env"
if env_file.is_file():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables and root .env."""

    model_config = SettingsConfigDict(
        env_file=str(env_file) if env_file.is_file() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.5-flash-lite", alias="GEMINI_MODEL")
    environment: Literal["development", "production", "test"] = "development"
    host: str = "0.0.0.0"
    port: int = 8000

    allowed_origins_raw: str = Field(default="", alias="ALLOWED_ORIGINS")

    rate_limit_plan: int = 15
    rate_limit_ideas: int = 10
    rate_limit_recalculate: int = 60

    @property
    def allowed_origins(self) -> list[str]:
        """Parse comma-separated or JSON list of allowed CORS origins."""
        raw = self.allowed_origins_raw.strip()
        if not raw:
            return [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "*",
            ]
        if raw.startswith("[") and raw.endswith("]"):
            import json

            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed]
            except Exception:
                pass
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Returns a cached singleton instance of Settings."""
    return Settings()


# Singleton instance for backwards-compatible imports
settings = get_settings()
