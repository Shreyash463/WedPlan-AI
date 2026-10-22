"""Unit tests for vendor checklist and budget linkage."""
from __future__ import annotations

from backend.app.engine.budget import generate_budget_plan
from backend.app.engine.vendors import generate_vendor_plan
from backend.app.models import (
    CityTierEnum,
    PriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


def test_vendor_category_budget_linkage():
    """Verify vendor categories receive allocated budget from budget plan."""
    budget_plan = generate_budget_plan(
        total_budget=5_000_000,
        guest_count=500,
        city_tier=CityTierEnum.METRO,
        functions=[
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
            WeddingFunctionEnum.RECEPTION,
        ],
        style=WeddingStyleEnum.ROYAL_PALACE,
        priorities=[PriorityEnum.FOOD, PriorityEnum.VENUE_DECOR],
    )

    vendor_plan = generate_vendor_plan(
        functions=[
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
            WeddingFunctionEnum.RECEPTION,
        ],
        budget_plan=budget_plan,
    )

    # Every vendor category should have positive allocated budget
    for cat in vendor_plan.categories:
        assert cat.allocated_budget > 0, f"Vendor category {cat.name} has 0 budget"
        assert len(cat.questions_to_ask) >= 3, f"Vendor {cat.name} missing questions"
        assert len(cat.contract_must_haves) >= 3, f"Vendor {cat.name} missing contract clauses"
        assert cat.lead_time_weeks > 0


def test_vendor_category_function_filtering():
    """Verify Mehendi vendor is excluded if Mehendi function is not selected."""
    budget_plan = generate_budget_plan(
        total_budget=1_000_000,
        guest_count=200,
        city_tier=CityTierEnum.TIER_2,
        functions=[WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.BUDGET_SMART,
        priorities=[],
    )

    vendor_plan = generate_vendor_plan(
        functions=[WeddingFunctionEnum.WEDDING],
        budget_plan=budget_plan,
    )

    category_ids = [c.id for c in vendor_plan.categories]
    assert "vendor_mehendi" not in category_ids
    assert "vendor_venue" in category_ids
    assert "vendor_catering" in category_ids


def test_overdue_vendors_with_mocked_today():
    """Verify that when wedding date is within standard vendor lead times, overdue vendors are surfaced in Overview warnings."""
    from datetime import date, timedelta

    from backend.app.engine.planner import build_overview_summary, orchestrate_engine
    from backend.app.models import PlanRequest

    mocked_today = date(2026, 10, 22)
    # Wedding in 30 days (short notice)
    wedding_date = mocked_today + timedelta(days=30)

    req = PlanRequest(
        wedding_date=wedding_date,
        city="Pune",
        city_tier=CityTierEnum.TIER_2,
        total_budget=1_500_000,
        guest_count=200,
        functions=[WeddingFunctionEnum.WEDDING, WeddingFunctionEnum.RECEPTION],
        style=WeddingStyleEnum.TRADITIONAL,
        priorities=[],
    )

    budget_plan, timeline_plan, vendor_plan = orchestrate_engine(req, today=mocked_today)
    overview = build_overview_summary(
        req, budget_plan, timeline_plan, vendor_plan=vendor_plan, today=mocked_today
    )

    # Check that overdue vendor warning was generated
    overdue_warnings = [
        w for w in overview.key_warnings if w.startswith("Book these vendors immediately:")
    ]
    assert len(overdue_warnings) == 1, "Expected overdue vendors warning in overview key_warnings"
    warning_text = overdue_warnings[0]
    # Venue (26 weeks = 182 days) and Catering (18 weeks = 126 days) must be in overdue list
    assert "Wedding & Reception Venue" in warning_text
    assert "Catering & Banquet Dining" in warning_text


def test_no_overdue_vendors_when_far_away():
    """Verify that when wedding date is far in the future (> 7 months), no overdue vendor warning is raised."""
    from datetime import date, timedelta

    from backend.app.engine.planner import build_overview_summary, orchestrate_engine
    from backend.app.models import PlanRequest

    mocked_today = date(2026, 10, 22)
    # Wedding in 300 days (10 months away)
    wedding_date = mocked_today + timedelta(days=300)

    req = PlanRequest(
        wedding_date=wedding_date,
        city="Pune",
        city_tier=CityTierEnum.TIER_2,
        total_budget=1_500_000,
        guest_count=200,
        functions=[WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.TRADITIONAL,
        priorities=[],
    )

    budget_plan, timeline_plan, vendor_plan = orchestrate_engine(req, today=mocked_today)
    overview = build_overview_summary(
        req, budget_plan, timeline_plan, vendor_plan=vendor_plan, today=mocked_today
    )

    overdue_warnings = [
        w for w in overview.key_warnings if w.startswith("Book these vendors immediately:")
    ]
    assert len(overdue_warnings) == 0, f"Expected 0 overdue warnings, got {overdue_warnings}"
