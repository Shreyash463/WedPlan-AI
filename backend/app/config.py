"""Application configuration settings."""
from __future__ import annotations

import os


class Settings:
    """Runtime configuration loaded from environment variables."""

    def __init__(self) -> None:
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.host: str = os.getenv("HOST", "0.0.0.0")
        self.port: int = int(os.getenv("PORT", "8000"))

        # CORS
        raw_origins = os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
        )
        self.allowed_origins: list[str] = [
            origin.strip() for origin in raw_origins.split(",") if origin.strip()
        ]

        # Rate limits (requests per minute per IP)
        self.rate_limit_plan: int = int(os.getenv("RATE_LIMIT_PLAN", "15"))
        self.rate_limit_ideas: int = int(os.getenv("RATE_LIMIT_IDEAS", "10"))
        self.rate_limit_recalculate: int = int(os.getenv("RATE_LIMIT_RECALCULATE", "60"))


settings = Settings()
