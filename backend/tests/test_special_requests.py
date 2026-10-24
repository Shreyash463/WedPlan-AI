"""Unit tests for special requests recognition, couple name formatting, currency normalization, and tight budget checks."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from backend.app.ai.ideas import (
    build_fallback_ideas,
    extract_recognized_special_themes,
    generate_wedding_ideas,
)
from backend.app.engine.formatters import format_couple_name, normalize_currency_in_text
from backend.app.engine.planner import orchestrate_engine
from backend.app.models import (
    CityTierEnum,
    PlanRequest,
    PriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


def test_special_requests_echo_omits_gibberish():
    """Verify that gibberish in special requests is never repeated and no Tailored line is added."""
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
        assert "Tailored for:" not in ideas.overview_summary


def test_special_requests_echo_recognized_themes():
    """Verify recognized cultural/dietary themes are extracted and formatted cleanly."""
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
    assert "Tailored for:" in ideas.overview_summary
    assert "pure Jain" in ideas.overview_summary
    assert "sunset outdoor" in ideas.overview_summary
    assert "Need 100% pure Jain catering and sunset outdoor pheras" not in ideas.overview_summary


def test_format_couple_name_normalization():
    """Verify couple name title casing, connector words, acronyms, and punctuation."""
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
    """Verify that varied currency notations are normalized to rupee symbol with Indian grouping."""
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
    today = date(2026, 10, 23)
    wedding_date = today + timedelta(days=43)

    req = PlanRequest(
        couple_name="namrata and chetan",
        wedding_date=wedding_date,
        city="pune",
        city_tier=CityTierEnum.TIER_2,
        total_budget=325000,
        guest_count=610,
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

    _, timeline_plan, vendor_plan = orchestrate_engine(req, today=today)

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

    for task in timeline_plan.tasks:
        task_text = f"{task.title} {task.description}".lower()
        for bw in premium_buzzwords:
            assert bw not in task_text, f"Forbidden premium term '{bw}' found in timeline task '{task.id}': {task_text}"

    for cat in vendor_plan.categories:
        vendor_text = (
            f"{cat.advance_payment_guidance} {' '.join(cat.questions_to_ask)} {' '.join(cat.contract_must_haves)}"
        ).lower()
        for bw in premium_buzzwords:
            assert bw not in vendor_text, f"Forbidden premium term '{bw}' found in vendor profile '{cat.id}'"


@pytest.mark.asyncio
async def test_gemini_ideas_postprocessing_with_mock():
    """Verify Gemini AI output post-processing normalizes currency mentions and preserves percent phrasing."""
    from backend.app.ai.client import FakeGeminiClient
    from backend.app.ai.ideas import GeminiIdeasResponse

    canned = GeminiIdeasResponse(
        overview_summary="A grand celebration in Pune. Save INR 50,000 by booking early.",
        themes_and_decor=["Marigold canopy with fairy lights costing Rs. 25000."],
        catering_and_menu=["Regional thali costing Rs 500 per guest."],
        function_activities=[{"function": "Wedding", "activity": "Traditional varmala ceremony saving 40 percent roughly."}],
        guest_experience_ideas=["Welcome refreshment counter."],
        money_saving_hacks=["Clubbing ceremonies saves INR 150000 on separate fees."],
    )
    fake_client = FakeGeminiClient(canned_response=canned)

    ideas = await generate_wedding_ideas(
        city="Pune",
        city_tier=CityTierEnum.TIER_2,
        total_budget=2500000,
        guest_count=300,
        functions=[WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.TRADITIONAL,
        priorities=[],
        client=fake_client,
    )

    assert ideas.ideas_source == "gemini"
    assert "₹50,000" in ideas.overview_summary
    assert "INR" not in ideas.overview_summary
    assert "₹25,000" in ideas.themes_and_decor[0]
    assert "Rs." not in ideas.themes_and_decor[0]
    assert "₹500" in ideas.catering_and_menu[0]
    assert "₹1,50,000" in ideas.money_saving_hacks[0]
    assert "saving 40 percent" in ideas.function_activities[0].activity
