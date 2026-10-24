"""Unit tests for formatting utilities, city casing, and budget-band constrained ideas."""

from __future__ import annotations

from backend.app.ai.ideas import (
    FORBIDDEN_PREMIUM_TERMS,
    build_fallback_ideas,
    determine_budget_band,
)
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
    """Verify clean title-casing of Indian city names including hyphenated and uppercase strings."""
    assert title_case_city("delhi") == "Delhi"
    assert title_case_city("new delhi") == "New Delhi"
    assert title_case_city("jaipur") == "Jaipur"
    assert title_case_city("  bengaluru  ") == "Bengaluru"
    assert title_case_city("pune") == "Pune"
    assert title_case_city("NAGPUR") == "Nagpur"
    assert title_case_city("navi mumbai") == "Navi Mumbai"
    assert title_case_city("hubli-dharwad") == "Hubli-Dharwad"
    assert title_case_city("") == ""


def test_royal_vibe_tight_budget_yields_zero_premium():
    """Verify Royal/Palace on Tight budget strictly avoids premium items."""
    band, cost_per_guest, note = determine_budget_band(
        total_budget=640000,
        guest_count=300,
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ROYAL_PALACE,
    )
    assert band == "Tight"
    assert cost_per_guest == 2133
    assert "Tight" in note

    ideas = build_fallback_ideas(
        city="Delhi",
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ROYAL_PALACE,
        functions=[
            WeddingFunctionEnum.HALDI,
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
        ],
        priorities=[PriorityEnum.FOOD],
        special_requests=None,
        total_budget=640000,
        guest_count=300,
    )

    all_text = " ".join(
        [ideas.overview_summary or ""]
        + ideas.themes_and_decor
        + ideas.catering_and_menu
        + [a.activity for a in ideas.function_activities]
        + ideas.guest_experience_ideas
        + ideas.money_saving_hacks
    ).lower()

    for forbidden in FORBIDDEN_PREMIUM_TERMS:
        assert forbidden not in all_text, f"Forbidden premium term '{forbidden}' leaked into Tight ideas: {all_text}"


def test_royal_vibe_premium_budget_yields_premium_items():
    """Verify Royal/Palace on Premium budget includes elevated palace concepts."""
    band, cost_per_guest, note = determine_budget_band(
        total_budget=6000000,
        guest_count=300,
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ROYAL_PALACE,
    )
    assert band == "Premium"
    assert cost_per_guest == 20000
    assert "Premium" in note

    ideas = build_fallback_ideas(
        city="Udaipur",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.ROYAL_PALACE,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.FOOD],
        special_requests=None,
        total_budget=6000000,
        guest_count=300,
    )

    all_text = " ".join(
        [ideas.overview_summary or ""]
        + ideas.themes_and_decor
        + ideas.catering_and_menu
        + [a.activity for a in ideas.function_activities]
        + ideas.guest_experience_ideas
        + ideas.money_saving_hacks
    ).lower()

    assert any(term in all_text for term in ["thikri", "rajputana", "palace", "chandeliers", "bespoke", "dum pukht"])


def test_budget_smart_forbids_premium_terms():
    """Verify Budget-smart vibe always evaluates as Tight band and enforces zero-premium policy."""
    band, cost_per_guest, note = determine_budget_band(
        total_budget=5000000,
        guest_count=200,
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.BUDGET_SMART,
    )
    assert band == "Tight"

    ideas = build_fallback_ideas(
        city="Mumbai",
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.BUDGET_SMART,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[],
        special_requests=None,
        total_budget=5000000,
        guest_count=200,
    )

    all_text = " ".join(
        [ideas.overview_summary or ""]
        + ideas.themes_and_decor
        + ideas.catering_and_menu
        + [a.activity for a in ideas.function_activities]
        + ideas.guest_experience_ideas
        + ideas.money_saving_hacks
    ).lower()

    for forbidden in FORBIDDEN_PREMIUM_TERMS:
        assert forbidden not in all_text, f"Forbidden premium term '{forbidden}' leaked into Budget-smart ideas: {all_text}"


def test_ideas_respect_special_requests():
    """Verify special request keywords dynamically inject relevant themes into ideas."""
    ideas_jain = build_fallback_ideas(
        city="Ahmedabad",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.TRADITIONAL,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[],
        special_requests="Strict pure Jain food without potatoes or onions",
        total_budget=2000000,
        guest_count=250,
    )
    assert any("jain" in m.lower() for m in ideas_jain.catering_and_menu)

    ideas_sunset = build_fallback_ideas(
        city="Goa",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.DESTINATION,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[],
        special_requests="Sunset beach wedding ceremony outdoors",
        total_budget=3000000,
        guest_count=150,
    )
    assert any("sunset" in t.lower() or "outdoor" in t.lower() for t in ideas_sunset.themes_and_decor)

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

    ideas_punjabi = build_fallback_ideas(
        city="Chandigarh",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.TRADITIONAL,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.FOOD],
        special_requests="Punjabi food menu with lassi bar",
        total_budget=2000000,
        guest_count=250,
    )
    assert any("punjabi" in m.lower() or "amritsari" in m.lower() for m in ideas_punjabi.catering_and_menu)


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

    assert any(str(guest_count) in tip for tip in ideas.money_saving_hacks)
    assert any(
        "clubbing daytime" in tip.lower() or "haldi and mehendi" in tip.lower() for tip in ideas.money_saving_hacks
    )
