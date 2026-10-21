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
