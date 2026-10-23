"""Unit tests for formatting utilities, city casing, and budget-band constrained ideas."""

from __future__ import annotations

import pytest

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
    """Verify Royal/Palace on Tight budget (e.g. Rs 6,40,000 for 300 guests in Metro) strictly avoids premium items."""
    band, cost_per_guest, note = determine_budget_band(
        total_budget=640000,
        guest_count=300,
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ROYAL_PALACE,
    )
    assert band == "Tight"
    assert cost_per_guest == 2133
    assert "₹2,133 per-guest budget (Tight)" in note
    assert "Royal/Palace" in note

    ideas = build_fallback_ideas(
        city="pune",
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ROYAL_PALACE,
        functions=[
            WeddingFunctionEnum.HALDI,
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
            WeddingFunctionEnum.RECEPTION,
            WeddingFunctionEnum.ENGAGEMENT,
        ],
        priorities=[PriorityEnum.FOOD, PriorityEnum.VENUE_DECOR],
        special_requests=None,
        total_budget=640000,
        guest_count=300,
    )

    assert ideas.budget_band == "Tight"
    assert "₹2,133" in (ideas.budget_band_note or "")

    # Assert city name is Title Case in overview summary and themes
    assert "pune" not in ideas.overview_summary
    assert "Pune" in ideas.overview_summary

    all_texts = (
        ideas.themes_and_decor
        + ideas.catering_and_menu
        + [a.activity for a in ideas.function_activities]
        + ideas.guest_experience_ideas
        + ideas.money_saving_hacks
    )

    # ZERO premium items allowed
    for text in all_texts:
        text_lower = text.lower()
        for forbidden in FORBIDDEN_PREMIUM_TERMS:
            assert forbidden not in text_lower, (
                f"Forbidden premium term '{forbidden}' found in Royal+Tight text: '{text}'"
            )

    # Must provide 'royal look on a budget' alternatives
    assert any("royal look on a budget" in t.lower() or "brass urli" in t.lower() for t in ideas.themes_and_decor)
    assert any("heritage palace aesthetic" in t.lower() or "shamiana" in t.lower() for t in ideas.themes_and_decor)
    assert any("royal feast on a budget" in m.lower() or "thali" in m.lower() for m in ideas.catering_and_menu)


def test_royal_vibe_premium_budget_yields_premium_items():
    """Verify Royal/Palace on Premium budget includes luxury and premium ideas."""
    band, cost_per_guest, _ = determine_budget_band(
        total_budget=5000000,
        guest_count=200,
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ROYAL_PALACE,
    )
    assert band == "Premium"
    assert cost_per_guest == 25000

    ideas = build_fallback_ideas(
        city="Jaipur",
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.ROYAL_PALACE,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.FOOD],
        special_requests=None,
        total_budget=5000000,
        guest_count=200,
    )

    assert ideas.budget_band == "Premium"
    all_texts = ideas.themes_and_decor + ideas.catering_and_menu
    assert any("imperial" in t.lower() or "chandelier" in t.lower() or "curated" in t.lower() for t in all_texts)


def test_budget_smart_forbids_premium_terms():
    """Verify that Budget-smart strictly excludes luxury/premium terms."""
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
    # 1. Jain / Vegetarian keyword
    ideas_jain = build_fallback_ideas(
        city="Mumbai",
        city_tier=CityTierEnum.METRO,
        style=WeddingStyleEnum.TRADITIONAL,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.FOOD],
        special_requests="Strict pure Jain vegetarian catering",
        total_budget=2500000,
        guest_count=300,
    )
    assert any("jain" in m.lower() for m in ideas_jain.catering_and_menu)

    # 2. Sunset / Outdoor keyword
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
    assert any("sunset" in t.lower() or "outdoor" in t.lower() for t in ideas_sunset.themes_and_decor)

    # 3. Eco keyword
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

    # 4. Punjabi keyword
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


def test_special_requests_echo_omits_gibberish():
    """Verify that gibberish in special requests is never repeated and no Tailored line is added."""
    from backend.app.ai.ideas import extract_recognized_special_themes

    gibberish_inputs = ["mkmkmkmk", "123456", "asdfasdf", "qwertyuiop!@#$", "xyzabc"]
    for gib in gibberish_inputs:
        recognized = extract_recognized_special_themes(gib)
        assert recognized == [], f"Expected empty list for gibberish '{gib}', got {recognized}"

        ideas = build_fallback_ideas(
            city="Pune",
            city_tier=CityTierEnum.TIER_2,
            style=WeddingStyleEnum.TRADITIONAL,
            functions=[WeddingFunctionEnum.WEDDING],
            priorities=[],
            special_requests=gib,
            total_budget=1500000,
            guest_count=200,
        )
        assert gib not in ideas.overview_summary, f"Raw gibberish '{gib}' was repeated in overview_summary"
        assert "Tailored for:" not in ideas.overview_summary, (
            f"Tailored for: was unexpectedly included for gibberish '{gib}'"
        )


def test_special_requests_echo_recognized_themes():
    """Verify recognized cultural/dietary themes are extracted and formatted cleanly."""
    from backend.app.ai.ideas import extract_recognized_special_themes

    req_text = "Need 100% pure Jain catering and sunset outdoor pheras"
    recognized = extract_recognized_special_themes(req_text)
    assert "pure Jain" in recognized
    assert "sunset outdoor" in recognized

    ideas = build_fallback_ideas(
        city="Jaipur",
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.ROYAL_PALACE,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[],
        special_requests=req_text,
        total_budget=2000000,
        guest_count=200,
    )
    # The summary must contain 'Tailored for: pure Jain, sunset outdoor' (or similar recognized labels)
    assert "Tailored for:" in ideas.overview_summary
    assert "pure Jain" in ideas.overview_summary
    assert "sunset outdoor" in ideas.overview_summary
    # Raw uncurated request sentence is NOT blindly repeated
    assert "Need 100% pure Jain catering and sunset outdoor pheras" not in ideas.overview_summary


def test_format_couple_name_normalization():
    """Verify couple name title casing, connector words, acronyms, and punctuation."""
    from backend.app.engine.formatters import format_couple_name

    assert format_couple_name("namrata and chetan") == "Namrata and Chetan"
    assert format_couple_name("priya & rohan") == "Priya & Rohan"
    assert format_couple_name("ANJALI WEDS VIKRAM") == "Anjali weds Vikram"
    assert format_couple_name("dj rahul with mc simran") == "DJ Rahul with MC Simran"
    assert format_couple_name("mary-jane and chetan o'connor") == "Mary-Jane and Chetan O'Connor"
    assert format_couple_name("chetan's celebration") == "Chetan's Celebration"
    assert format_couple_name("   multiple    spaces   ") == "Multiple Spaces"
    assert format_couple_name("") is None
    assert format_couple_name(None) is None


def test_couple_name_in_plan_request_model():
    """Verify PlanRequest validates and normalizes couple_name via field_validator."""
    from datetime import date, timedelta

    from backend.app.models import PlanRequest

    req = PlanRequest(
        couple_name="  namrata and chetan  ",
        wedding_date=date.today() + timedelta(days=90),
        city="pune",
        city_tier=CityTierEnum.TIER_2,
        total_budget=1500000,
        guest_count=200,
        functions=[WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.TRADITIONAL,
    )
    assert req.couple_name == "Namrata and Chetan"
    assert req.city == "Pune"


def test_normalize_currency_in_text_patterns():
    """Verify that varied currency notations (INR, Rs., Rs) are normalized to rupee symbol with Indian grouping."""
    from backend.app.engine.formatters import normalize_currency_in_text

    text = "Save INR 50,000 on catering, Rs. 50000 on decor, and Rs 2500000 on venue, saving 40 percent roughly."
    normalized = normalize_currency_in_text(text)
    assert "₹50,000" in normalized
    assert "₹25,00,000" in normalized
    assert "INR" not in normalized
    assert "Rs." not in normalized
    assert "Rs 50" not in normalized
    assert "saving 40 percent" in normalized


def test_tight_plan_zero_premium_in_timeline_and_vendors():
    """Verify that a Tight-budget plan contains zero premium-tagged wording in timeline and vendors."""
    from datetime import date, timedelta

    from backend.app.engine.planner import orchestrate_engine
    from backend.app.models import PlanRequest

    today = date(2026, 10, 23)
    wedding_date = today + timedelta(days=43)

    req = PlanRequest(
        couple_name="namrata and chetan",
        wedding_date=wedding_date,
        city="pune",
        city_tier=CityTierEnum.TIER_2,
        total_budget=325000,
        guest_count=610,  # ~Rs 532 / guest -> Strict Tight budget band
        functions=[
            WeddingFunctionEnum.HALDI,
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
            WeddingFunctionEnum.RECEPTION,
        ],
        style=WeddingStyleEnum.ECO_FRIENDLY,
        priorities=[PriorityEnum.FOOD],
    )

    budget_plan, timeline_plan, vendor_plan = orchestrate_engine(req, today=today)

    premium_buzzwords = [
        "cold pyro",
        "pyrotechnic",
        "drone pilots",
        "drone operator",
        "3d stage renders",
        "3d render",
        "crystal chandelier",
        "hydraulic lift",
    ]

    # Check timeline tasks
    for task in timeline_plan.tasks:
        task_text = f"{task.title} {task.description}".lower()
        for bw in premium_buzzwords:
            assert bw not in task_text, f"Forbidden premium term '{bw}' found in timeline task '{task.id}': {task_text}"

    # Check vendor items
    for cat in vendor_plan.categories:
        vendor_text = (
            f"{cat.advance_payment_guidance} {' '.join(cat.questions_to_ask)} {' '.join(cat.contract_must_haves)}"
        ).lower()
        for bw in premium_buzzwords:
            assert bw not in vendor_text, (
                f"Forbidden premium term '{bw}' found in vendor profile '{cat.id}': {vendor_text}"
            )


@pytest.mark.asyncio
async def test_gemini_ideas_postprocessing_with_mock():
    """Verify Gemini AI output post-processing normalizes currency mentions and preserves percent phrasing."""
    import json
    from unittest.mock import MagicMock, patch

    from backend.app.ai.ideas import generate_wedding_ideas
    from backend.app.config import settings

    mock_gemini_json = json.dumps(
        {
            "overview_summary": "A grand celebration in Pune. Save INR 50,000 by booking early.",
            "themes_and_decor": ["Marigold canopy with fairy lights costing Rs. 25000."],
            "catering_and_menu": ["Regional thali costing Rs 500 per guest."],
            "function_activities": [
                {"function": "Wedding", "activity": "Traditional varmala ceremony saving 40 percent roughly."}
            ],
            "guest_experience_ideas": ["Welcome refreshment counter."],
            "money_saving_hacks": ["Clubbing ceremonies saves INR 150000 on separate fees."],
        }
    )

    mock_resp = MagicMock()
    mock_resp.text = mock_gemini_json

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    with (
        patch.object(settings, "gemini_api_key", "test-key-mock-123"),
        patch("google.genai.Client", return_value=mock_client),
    ):
        ideas = await generate_wedding_ideas(
            city="Pune",
            city_tier=CityTierEnum.TIER_2,
            total_budget=2500000,
            guest_count=300,
            functions=[WeddingFunctionEnum.WEDDING],
            style=WeddingStyleEnum.TRADITIONAL,
            priorities=[],
        )

    assert ideas.ideas_source == "gemini"
    assert "₹50,000" in ideas.overview_summary
    assert "INR" not in ideas.overview_summary
    assert "₹25,000" in ideas.themes_and_decor[0]
    assert "Rs." not in ideas.themes_and_decor[0]
    assert "₹500" in ideas.catering_and_menu[0]
    assert "₹1,50,000" in ideas.money_saving_hacks[0]
    assert "saving 40 percent" in ideas.function_activities[0].activity
