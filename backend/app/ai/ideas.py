"""Personalized ideas generation using Google Gemini with deterministic fallback and caching."""

from __future__ import annotations

import logging
import time
from collections.abc import Sequence

from pydantic import BaseModel

from backend.app.ai.client import GeminiClientProtocol, RealGeminiClient
from backend.app.ai.fallback import (
    build_fallback_ideas,
    determine_budget_band,
    extract_recognized_special_themes,
)
from backend.app.cache import ideas_cache
from backend.app.config import get_settings
from backend.app.engine.data.ideas_data import FORBIDDEN_PREMIUM_TERMS
from backend.app.engine.formatters import format_inr, normalize_currency_in_text, title_case_city
from backend.app.models import (
    CityTierEnum,
    FunctionActivity,
    IdeasPlan,
    PriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)
from backend.app.security import compute_plan_hash, sanitize_input_text

logger = logging.getLogger("wedplan.ai")


class GeminiActivityItem(BaseModel):
    function: str
    activity: str


class GeminiIdeasResponse(BaseModel):
    overview_summary: str
    themes_and_decor: list[str]
    catering_and_menu: list[str]
    function_activities: list[GeminiActivityItem]
    guest_experience_ideas: list[str]
    money_saving_hacks: list[str]


def _clean_ai_output(plan: IdeasPlan) -> IdeasPlan:
    """Normalize currency notations in generated plan text."""
    plan.overview_summary = normalize_currency_in_text(plan.overview_summary)
    plan.themes_and_decor = [normalize_currency_in_text(t) for t in plan.themes_and_decor]
    plan.catering_and_menu = [normalize_currency_in_text(m) for m in plan.catering_and_menu]
    for act in plan.function_activities:
        act.activity = normalize_currency_in_text(act.activity)
    plan.guest_experience_ideas = [normalize_currency_in_text(g) for g in plan.guest_experience_ideas]
    plan.money_saving_hacks = [normalize_currency_in_text(h) for h in plan.money_saving_hacks]
    return plan


def _filter_premium_from_tight(ideas: IdeasPlan) -> None:
    """Sanitize any premium phrases if AI returned them in a Tight budget plan."""

    def clean(text: str) -> str:
        res = text
        for term in FORBIDDEN_PREMIUM_TERMS:
            if term in res.lower():
                res = res.replace(term, "traditional celebration")
        return res

    ideas.themes_and_decor = [clean(t) for t in ideas.themes_and_decor]
    ideas.catering_and_menu = [clean(m) for m in ideas.catering_and_menu]
    for act in ideas.function_activities:
        act.activity = clean(act.activity)
    ideas.guest_experience_ideas = [clean(g) for g in ideas.guest_experience_ideas]


async def generate_wedding_ideas(
    city: str,
    city_tier: CityTierEnum | str,
    total_budget: int,
    guest_count: int,
    functions: Sequence[WeddingFunctionEnum | str],
    style: WeddingStyleEnum | str,
    priorities: Sequence[PriorityEnum | str],
    special_requests: str | None = None,
    client: GeminiClientProtocol | None = None,
) -> IdeasPlan:
    """Generate personalized wedding ideas via Gemini AI with deterministic fallback."""
    clean_city = title_case_city(city)
    style_val = style.value if hasattr(style, "value") else str(style)
    func_names = [f.value if hasattr(f, "value") else str(f) for f in functions]
    priority_names = [p.value if hasattr(p, "value") else str(p) for p in priorities]
    sanitized_special = sanitize_input_text(special_requests, max_length=120)

    band, cost_per_guest, band_note = determine_budget_band(total_budget, guest_count, city_tier, style)
    cache_payload = {
        "city": clean_city,
        "budget": total_budget,
        "guests": guest_count,
        "style": style_val,
        "functions": list(func_names),
        "priorities": list(priority_names),
        "special": sanitized_special,
    }
    cache_key = compute_plan_hash(cache_payload)

    cached = ideas_cache.get(cache_key)
    if isinstance(cached, IdeasPlan):
        logger.info("Returning cached wedding ideas for hash: %s", cache_key[:8])
        return cached

    cfg = get_settings()
    api_key = cfg.gemini_api_key

    if not api_key:
        fallback = build_fallback_ideas(
            clean_city, city_tier, style, functions, priorities, sanitized_special, total_budget, guest_count
        )
        ideas_cache.set(cache_key, fallback)
        return fallback

    prompt = (
        f"You are WedPlan AI, an expert Indian wedding planner. Generate personalized concepts for a wedding in {clean_city} "
        f"with total budget {format_inr(total_budget)} for {guest_count} guests ({format_inr(cost_per_guest)}/guest, {band} budget band). "
        f"Style: {style_val}. Functions: {', '.join(func_names)}. Priorities: {', '.join(priority_names)}. Special: {sanitized_special or 'None'}."
    )

    try:
        ai_client = client or RealGeminiClient(api_key=api_key)
        start_time = time.time()
        resp = await ai_client.generate_json(
            model=cfg.gemini_model, contents=prompt, response_schema=GeminiIdeasResponse
        )
        logger.info("Generated ideas via Gemini in %.2fs", time.time() - start_time)

        gemini_data = resp if isinstance(resp, GeminiIdeasResponse) else GeminiIdeasResponse.model_validate(resp)
        result = IdeasPlan(
            overview_summary=f"{gemini_data.overview_summary} {band_note}",
            themes_and_decor=gemini_data.themes_and_decor,
            catering_and_menu=gemini_data.catering_and_menu,
            function_activities=[
                FunctionActivity(function=a.function, activity=a.activity) for a in gemini_data.function_activities
            ],
            guest_experience_ideas=gemini_data.guest_experience_ideas,
            money_saving_hacks=gemini_data.money_saving_hacks,
            ideas_source="gemini",
            budget_band=band,
            budget_band_note=band_note,
        )

        _clean_ai_output(result)
        if band == "Tight":
            _filter_premium_from_tight(result)

        ideas_cache.set(cache_key, result)
        return result
    except Exception as exc:
        logger.warning("Gemini API call failed (%s). Using fallback ideas.", exc)
        fallback = build_fallback_ideas(
            clean_city, city_tier, style, functions, priorities, sanitized_special, total_budget, guest_count
        )
        ideas_cache.set(cache_key, fallback)
        return fallback


__all__ = [
    "build_fallback_ideas",
    "determine_budget_band",
    "extract_recognized_special_themes",
    "generate_wedding_ideas",
]
