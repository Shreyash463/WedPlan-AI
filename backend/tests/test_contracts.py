"""API contract tests pinning response shapes for all public endpoints."""

from __future__ import annotations

from datetime import date, timedelta

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_contract():
    """Verify GET /api/health contract schema."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"status", "gemini_configured", "model", "python"}
    assert data["status"] == "ok"
    assert isinstance(data["gemini_configured"], bool)
    assert isinstance(data["model"], str)
    assert isinstance(data["python"], str)


def test_plan_contract():
    """Verify POST /api/plan contract schema."""
    future_date = (date.today() + timedelta(days=120)).isoformat()
    payload = {
        "couple_name": "Priya & Rohan",
        "wedding_date": future_date,
        "city": "Jaipur",
        "city_tier": "Tier-2",
        "total_budget": 2500000,
        "guest_count": 250,
        "functions": ["Wedding", "Haldi", "Sangeet"],
        "style": "Royal/Palace",
        "priorities": ["Food", "Venue & Decor"],
        "special_requests": "Vegetarian",
    }
    resp = client.post("/api/plan", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert set(data.keys()) == {
        "overview",
        "budget",
        "timeline",
        "vendors",
        "ideas",
        "generated_at",
        "disclaimer",
    }

    # Pin Overview shape
    overview = data["overview"]
    assert "couple_name" in overview
    assert "wedding_date" in overview
    assert "city" in overview
    assert "city_tier" in overview
    assert "guest_count" in overview
    assert "total_budget" in overview
    assert "cost_per_guest" in overview
    assert "days_remaining" in overview
    assert "is_tight_timeline" in overview
    assert "health_status" in overview
    assert "summary" in overview
    assert "key_warnings" in overview

    # Pin Budget shape
    budget = data["budget"]
    assert "total_budget" in budget
    assert "guest_count" in budget
    assert "cost_per_guest" in budget
    assert "health_status" in budget
    assert "allocations" in budget
    assert "warnings" in budget
    assert "suggestions" in budget

    # Pin Timeline shape
    timeline = data["timeline"]
    assert "days_remaining" in timeline
    assert "is_tight_timeline" in timeline
    assert "phases" in timeline
    assert "tasks" in timeline

    # Pin Vendors shape
    vendors = data["vendors"]
    assert "categories" in vendors
    assert len(vendors["categories"]) > 0
    cat = vendors["categories"][0]
    assert "id" in cat
    assert "name" in cat
    assert "allocated_budget" in cat
    assert "lead_time_weeks" in cat
    assert "questions_to_ask" in cat
    assert "contract_must_haves" in cat


def test_recalculate_contract():
    """Verify POST /api/recalculate contract schema."""
    future_date = (date.today() + timedelta(days=90)).isoformat()
    payload = {
        "wedding_date": future_date,
        "city": "Jaipur",
        "city_tier": "Tier-2",
        "total_budget": 3000000,
        "guest_count": 300,
        "functions": ["Wedding"],
        "style": "Traditional",
        "priorities": ["Food"],
    }
    resp = client.post("/api/recalculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {
        "budget",
        "timeline",
        "vendors",
        "days_remaining",
        "is_tight_timeline",
    }


def test_ideas_contract():
    """Verify POST /api/ideas contract schema."""
    payload = {
        "city": "Pune",
        "city_tier": "Tier-2",
        "total_budget": 2000000,
        "guest_count": 200,
        "functions": ["Wedding", "Mehendi"],
        "style": "Traditional",
        "priorities": ["Food"],
    }
    resp = client.post("/api/ideas", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {
        "overview_summary",
        "themes_and_decor",
        "catering_and_menu",
        "function_activities",
        "guest_experience_ideas",
        "money_saving_hacks",
        "ideas_source",
        "budget_band",
        "budget_band_note",
    }
