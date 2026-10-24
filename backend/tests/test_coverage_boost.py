"""Targeted unit tests to achieve >=95% branch and statement test coverage across all backend modules."""

import time
from unittest.mock import MagicMock

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from backend.app.ai.client import FakeGeminiClient, RealGeminiClient
from backend.app.cache import TTLCache
from backend.app.config import get_settings
from backend.app.exceptions import (
    AIServiceError,
    PlanCalculationError,
    PlanningError,
    PlanValidationError,
)
from backend.app.main import app
from backend.app.rate_limit import SlidingWindowRateLimiter, get_client_ip
from backend.app.schemas.responses import IdeasPlan


def test_custom_exception_hierarchy() -> None:
    """Validate all custom exceptions inherit from PlanningError and set defaults."""
    base_exc = PlanningError(message="Custom error", code="CUSTOM_CODE", status_code=400)
    assert base_exc.status_code == 400
    assert base_exc.message == "Custom error"
    assert base_exc.code == "CUSTOM_CODE"

    val_exc = PlanValidationError(message="Validation failed")
    assert val_exc.status_code == 422
    assert "Validation failed" in str(val_exc)

    calc_exc = PlanCalculationError(message="Calculation failed")
    assert calc_exc.status_code == 500

    ai_exc = AIServiceError(message="AI failed")
    assert ai_exc.status_code == 502


@pytest.mark.asyncio
async def test_fake_gemini_client() -> None:
    """Validate FakeGeminiClient for local/testing isolation."""
    fake = FakeGeminiClient()
    resp = await fake.generate_json(model="test", contents="prompt", response_schema=IdeasPlan)
    assert fake.call_count == 1
    assert "Authentic mock" in resp.overview_summary

    err_fake = FakeGeminiClient(should_fail=True)
    with pytest.raises(RuntimeError):
        await err_fake.generate_json(model="test", contents="prompt", response_schema=IdeasPlan)


def test_real_gemini_client_initialization() -> None:
    """Validate RealGeminiClient initializes gracefully with provided API key."""
    client = RealGeminiClient(api_key="test-api-key")
    assert client.api_key == "test-api-key"
    assert client._client is None


def test_in_memory_ttl_cache() -> None:
    """Validate cache get, set, TTL expiration, and clear operations."""
    cache = TTLCache(ttl_seconds=1)
    assert cache.get("key1") is None

    cache.set("key1", "sample_ideas")
    assert cache.get("key1") == "sample_ideas"

    # Verify TTL expiration
    time.sleep(1.1)
    assert cache.get("key1") is None

    # Test clear
    cache.set("key2", "data")
    assert cache.get("key2") == "data"
    cache.clear()
    assert cache.get("key2") is None


def test_sliding_window_rate_limiter() -> None:
    """Validate rate limiter counter increments, limits, and window expiry."""
    limiter = SlidingWindowRateLimiter(requests_per_minute=2)
    ip = "192.168.1.1"

    allowed, retry_after = limiter.is_allowed(ip)
    assert allowed is True
    assert retry_after == 0

    allowed, retry_after = limiter.is_allowed(ip)
    assert allowed is True
    assert retry_after == 0

    allowed, retry_after = limiter.is_allowed(ip)
    assert allowed is False
    assert retry_after > 0


def test_get_client_ip_variants() -> None:
    """Validate IP extraction across forwarded headers, direct socket, and fallback."""
    # 1. Forwarded for
    req1 = MagicMock(spec=Request)
    req1.headers = {"X-Forwarded-For": "203.0.113.195, 70.41.3.18"}
    assert get_client_ip(req1) == "203.0.113.195"

    # 2. Client host
    req2 = MagicMock(spec=Request)
    req2.headers = {}
    req2.client.host = "10.0.0.5"
    assert get_client_ip(req2) == "10.0.0.5"

    # 3. No client
    req3 = MagicMock(spec=Request)
    req3.headers = {}
    req3.client = None
    assert get_client_ip(req3) == "127.0.0.1"


def test_settings_singleton_and_defaults() -> None:
    """Validate settings loads with sane defaults and singleton cache."""
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2
    assert s1.gemini_model != ""
    assert s1.rate_limit_plan > 0


def test_main_app_exception_handlers() -> None:
    """Validate app exception handling returns standardized envelope."""
    client = TestClient(app)

    # 404 test
    resp = client.get("/api/non-existent-route")
    assert resp.status_code == 404

    # Header with invalid length
    resp = client.get("/api/health", headers={"content-length": "not-a-number"})
    assert resp.status_code == 200
