"""Application configuration settings."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Search for .env starting from project root
ROOT_DIR = Path(__file__).resolve().parents[2]
env_file = ROOT_DIR / ".env"
if env_file.is_file():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()


class Settings:
    """Runtime configuration loaded from environment variables."""

    def __init__(self) -> None:
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash"
        self.environment: str = os.getenv("ENVIRONMENT", "development").strip()
        self.host: str = os.getenv("HOST", "0.0.0.0").strip()
        self.port: int = int(os.getenv("PORT", "8000"))

        # CORS: Default to "*" in cloud/serverless if ALLOWED_ORIGINS not explicitly defined
        raw_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
        if raw_origins:
            self.allowed_origins: list[str] = [
                origin.strip() for origin in raw_origins.split(",") if origin.strip()
            ]
        else:
            self.allowed_origins = [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "*",
            ]

        # Rate limits (requests per minute per IP)
        self.rate_limit_plan: int = int(os.getenv("RATE_LIMIT_PLAN", "15"))
        self.rate_limit_ideas: int = int(os.getenv("RATE_LIMIT_IDEAS", "10"))
        self.rate_limit_recalculate: int = int(os.getenv("RATE_LIMIT_RECALCULATE", "60"))


settings = Settings()
