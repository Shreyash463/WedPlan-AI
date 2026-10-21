"""Unit tests for formatting utilities and context-aware fallback ideas."""
from __future__ import annotations

from backend.app.ai.ideas import FORBIDDEN_PREMIUM_TERMS, build_fallback_ideas
from backend.app.engine.formatters import format_inr, format_inr_compact, title_case_city
from backend.app.models import (
    CityTierEnum,
    PriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


def test_format_inr_patterns():
    """Verify Indian numbering format 3-2-2 grouping."""
    assert format_inr(0) == "₹0"
    assert format_inr(500) == "₹500"
    assert format_inr(1000) == "₹1,000"
    assert format_inr(15000) == "₹15,000"
    assert format_inr(100000) == "₹1,00,000"
    assert format_inr(2500000) == "₹25,00,000"
    assert format_inr(100000000) == "₹10,00,00,000"
    assert format_inr(2500000, include_symbol=False) == "25,00,000"
    assert format_inr(-50000) == "-₹50,000"


def test_format_inr_compact_patterns():
    """Verify compact labels for Indian currency."""
    assert format_inr_compact(500) == "₹500"
    assert format_inr_compact(50000) == "₹50 K"
    assert format_inr_compact(800000) == "₹8 L"
    assert format_inr_compact(2500000) == "₹25 L"
    assert format_inr_compact(15000000) == "₹1.5 Cr"
    assert format_inr_compact(100000000) == "₹10 Cr"


def test_title_case_city_names():
    """Verify clean title-casing of Indian city names."""
    assert title_case_city("delhi") == "Delhi"
    assert title_case_city("new delhi") == "New Delhi"
    assert title_case_city("jaipur") == "Jaipur"
    assert title_case_city("  bengaluru  ") == "Bengaluru"
    assert title_case_city("") == ""


def test_budget_smart_forbids_premium_terms():
    """Verify that Budget-smart and tight budgets strictly exclude luxury/premium terms."""
    ideas = build_fallback_ideas(
        city="Jaipur",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.BUDGET_SMART,
        functions=[
            WeddingFunctionEnum.HALDI,
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.WEDDING,
        ],
        priorities=[PriorityEnum.VENUE_DECOR],
        special_requests=None,
        total_budget=500000,
        guest_count=200,
    )

    all_texts = (
        ideas.themes_and_decor
        + ideas.catering_and_menu
        + [a.activity for a in ideas.function_activities]
        + ideas.guest_experience_ideas
        + ideas.money_saving_hacks
    )

    for text in all_texts:
        text_lower = text.lower()
        for forbidden in FORBIDDEN_PREMIUM_TERMS:
            assert forbidden not in text_lower, (
                f"Forbidden premium term '{forbidden}' found in budget-smart text: '{text}'"
            )


def test_ideas_respect_special_requests():
    """Verify that keywords in special requests trigger tailored ideas."""
    # Test Jain / Vegetarian keyword
    ideas_jain = build_fallback_ideas(
        city="Mumbai",
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.TRADITIONAL,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.FOOD],
        special_requests="Strict pure Jain catering",
        total_budget=2500000,
        guest_count=300,
    )
    assert any("jain" in m.lower() for m in ideas_jain.catering_and_menu)

    # Test Sunset / Outdoor keyword
    ideas_sunset = build_fallback_ideas(
        city="Udaipur",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.DESTINATION,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.VENUE_DECOR],
        special_requests="Sunset lawn pheras",
        total_budget=3000000,
        guest_count=150,
    )
    assert any("sunset" in t.lower() for t in ideas_sunset.themes_and_decor)

    # Test Eco keyword
    ideas_eco = build_fallback_ideas(
        city="Bengaluru",
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ECO_FRIENDLY,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[],
        special_requests="Zero plastic green wedding",
        total_budget=1800000,
        guest_count=200,
    )
    assert any("zero-waste" in t.lower() or "plant" in t.lower() for t in ideas_eco.themes_and_decor)
    assert any("sapling" in g.lower() for g in ideas_eco.guest_experience_ideas)


def test_number_specific_saving_tips():
    """Verify money-saving tips mention the user's specific guest count and calculated amounts."""
    guest_count = 350
    total_budget = 2800000
    ideas = build_fallback_ideas(
        city="Pune",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.TRADITIONAL,
        functions=[
            WeddingFunctionEnum.HALDI,
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
        ],
        priorities=[PriorityEnum.FOOD],
        special_requests=None,
        total_budget=total_budget,
        guest_count=guest_count,
    )

    # Tip 1 should mention guest trimming
    assert any(str(guest_count) in tip for tip in ideas.money_saving_hacks)
    # Combining daytime ceremonies should be suggested since >3 functions
    assert any("clubbing daytime" in tip.lower() or "haldi and mehendi" in tip.lower() for tip in ideas.money_saving_hacks)
