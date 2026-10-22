"""Integration tests for FastAPI endpoints, security headers, rate limiting, and fallbacks."""
from __future__ import annotations

from datetime import date, timedelta
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.app.cache import ideas_cache
from backend.app.main import app
from backend.app.rate_limit import SlidingWindowRateLimiter

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_cache_and_limits():
    """Ensure clean test environment before each test."""
    ideas_cache.clear()
    with patch("backend.app.config.settings.gemini_api_key", ""):
        yield
    ideas_cache.clear()


def test_health_endpoint():
    """Verify /api/health returns ok status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_security_headers_present():
    """Verify standard security headers are applied to HTTP responses."""
    response = client.get("/api/health")
    headers = response.headers

    assert "content-security-policy" in headers
    assert "default-src 'self'" in headers["content-security-policy"]
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in headers.get("permissions-policy", "")


def test_plan_success_deterministic_fallback():
    """Verify /api/plan generates complete 5-section plan using deterministic fallback when Gemini is not configured."""
    wedding_date = (date.today() + timedelta(days=120)).isoformat()
    payload = {
        "couple_name": "Aarav & Simran",
        "wedding_date": wedding_date,
        "city": "Jaipur",
        "city_tier": "Tier-2",
        "total_budget": 2_500_000,
        "guest_count": 350,
        "functions": ["Haldi", "Mehendi", "Sangeet", "Wedding"],
        "style": "Royal/Palace",
        "priorities": ["Food", "Venue & Decor"],
        "special_requests": "Pure vegetarian catering, sunset Varmala",
    }

    response = client.post("/api/plan", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "overview" in data
    assert "budget" in data
    assert "timeline" in data
    assert "vendors" in data
    assert "ideas" in data
    assert data["ideas"]["ideas_source"] in ["gemini", "fallback"]
    assert data["budget"]["total_budget"] == 2_500_000
    assert len(data["budget"]["allocations"]) == 10
    assert len(data["vendors"]["categories"]) > 0
    assert len(data["timeline"]["tasks"]) > 0


def test_recalculate_no_gemini_call():
    """Verify /api/recalculate recomputes what-if changes instantly without AI calls."""
    wedding_date = (date.today() + timedelta(days=90)).isoformat()
    payload = {
        "wedding_date": wedding_date,
        "city": "Mumbai",
        "city_tier": "Metro",
        "total_budget": 4_000_000,
        "guest_count": 400,
        "functions": ["Wedding", "Reception"],
        "style": "Modern Minimal",
        "priorities": ["Food"],
    }

    response = client.post("/api/recalculate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "budget" in data
    assert "timeline" in data
    assert "vendors" in data
    assert data["budget"]["total_budget"] == 4_000_000
    assert data["budget"]["guest_count"] == 400
    assert data["budget"]["cost_per_guest"] == 10_000


def test_validation_errors_422():
    """Verify Pydantic validation rejects bad inputs and returns clean error schema."""
    # Past date
    bad_payload = {
        "wedding_date": "2020-01-01",
        "city": "Delhi",
        "city_tier": "Metro",
        "total_budget": 1_000_000,
        "guest_count": 200,
        "functions": ["Wedding"],
        "style": "Traditional",
    }
    response = client.post("/api/plan", json=bad_payload)
    assert response.status_code == 422
    err_data = response.json()
    assert "error" in err_data
    assert err_data["error"]["code"] == "VALIDATION_ERROR"
    assert "wedding_date" in str(err_data["error"]["details"])

    # Extra unknown field forbidden
    extra_field_payload = {
        "wedding_date": (date.today() + timedelta(days=60)).isoformat(),
        "city": "Delhi",
        "city_tier": "Metro",
        "total_budget": 1_000_000,
        "guest_count": 200,
        "functions": ["Wedding"],
        "style": "Traditional",
        "unknown_hack_field": "exploit",
    }
    response2 = client.post("/api/plan", json=extra_field_payload)
    assert response2.status_code == 422


def test_rate_limiting_429():
    """Verify sliding-window rate limit triggers 429 when quota is exceeded."""
    # Temporarily set tight rate limiter
    test_limiter = SlidingWindowRateLimiter(requests_per_minute=2)
    with patch.dict(
        "backend.app.routes.plan.rate_limiter.limiters", {"plan": test_limiter}
    ):
        wedding_date = (date.today() + timedelta(days=90)).isoformat()
        payload = {
            "wedding_date": wedding_date,
            "city": "Bengaluru",
            "city_tier": "Metro",
            "total_budget": 2_000_000,
            "guest_count": 250,
            "functions": ["Wedding"],
            "style": "Traditional",
        }

        # 1st request
        r1 = client.post("/api/plan", json=payload)
        assert r1.status_code == 200

        # 2nd request
        r2 = client.post("/api/plan", json=payload)
        assert r2.status_code == 200

        # 3rd request should exceed quota
        r3 = client.post("/api/plan", json=payload)
        assert r3.status_code == 429
        assert "Retry-After" in r3.headers
        assert r3.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"


def test_ideas_cache_avoids_repeated_calls():
    """Verify identical requests hit the TTL cache and return cached ideas."""
    wedding_date = (date.today() + timedelta(days=100)).isoformat()
    payload = {
        "wedding_date": wedding_date,
        "city": "Udaipur",
        "city_tier": "Tier-2",
        "total_budget": 3_000_000,
        "guest_count": 200,
        "functions": ["Wedding", "Sangeet"],
        "style": "Royal/Palace",
        "priorities": ["Venue & Decor"],
    }

    # Initial call populates cache
    r1 = client.post("/api/plan", json=payload)
    assert r1.status_code == 200
    cache_size_initial = ideas_cache.size()
    assert cache_size_initial >= 1

    # Second call should read from cache
    r2 = client.post("/api/plan", json=payload)
    assert r2.status_code == 200
    assert r2.json()["ideas"]["overview_summary"] == r1.json()["ideas"]["overview_summary"]


def test_city_name_casing_normalization():
    """Verify city name inputs like 'pune', 'NAGPUR', 'navi mumbai' are normalized to Title Case."""
    wedding_date = (date.today() + timedelta(days=90)).isoformat()
    test_cities = [
        ("pune", "Pune"),
        ("NAGPUR", "Nagpur"),
        ("navi mumbai", "Navi Mumbai"),
        ("hubli-dharwad", "Hubli-Dharwad"),
    ]
    for input_city, expected_city in test_cities:
        payload = {
            "wedding_date": wedding_date,
            "city": input_city,
            "city_tier": "Tier-2",
            "total_budget": 1_500_000,
            "guest_count": 200,
            "functions": ["Wedding"],
            "style": "Traditional",
            "priorities": [],
        }
        res = client.post("/api/plan", json=payload)
        assert res.status_code == 200
        plan = res.json()
        assert plan["overview"]["city"] == expected_city
        assert expected_city in plan["overview"]["summary"]
        assert expected_city in plan["ideas"]["overview_summary"]
        # Ensure raw lowercase string does not appear in overview summary
        if input_city != expected_city:
            assert f" {input_city} " not in f" {plan['overview']['summary']} "

