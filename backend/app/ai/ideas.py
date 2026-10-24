"""Personalized ideas generation using Google Gemini with deterministic fallback and caching."""

from __future__ import annotations

import logging
import time
from collections.abc import Sequence

from pydantic import BaseModel

from backend.app.ai.client import GeminiClientProtocol, RealGeminiClient
from backend.app.cache import ideas_cache
from backend.app.config import get_settings
from backend.app.constants import CITY_TIER_BENCHMARKS
from backend.app.engine.data.ideas_data import (
    FORBIDDEN_PREMIUM_TERMS,
    RECOGNIZED_SPECIAL_THEME_RULES,
    TaggedIdea,
    get_base_idea_pool,
)
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


def extract_recognized_special_themes(text: str | None) -> list[str]:
    """Extract recognized cultural and dietary themes from special requests."""
    if not text:
        return []
    clean_lower = text.lower().strip()
    recognized: list[str] = []
    for keywords, label in RECOGNIZED_SPECIAL_THEME_RULES:
        if any(kw in clean_lower for kw in keywords) and label not in recognized:
            recognized.append(label)
    return recognized


def determine_budget_band(
    total_budget: int,
    guest_count: int,
    city_tier: CityTierEnum | str,
    style: WeddingStyleEnum | str,
) -> tuple[str, int, str]:
    """Calculate per-guest spend and evaluate the strict budget band."""
    cost_per_guest = total_budget // max(guest_count, 1)
    tier_key = city_tier.value if hasattr(city_tier, "value") else str(city_tier)
    style_key = style.value if hasattr(style, "value") else str(style)
    tier_info = CITY_TIER_BENCHMARKS.get(tier_key, CITY_TIER_BENCHMARKS["Tier-2"])
    healthy_min = tier_info["healthy_min"]

    if style_key == WeddingStyleEnum.BUDGET_SMART.value or cost_per_guest < healthy_min:
        band = "Tight"
    elif cost_per_guest >= int(healthy_min * 1.8):
        band = "Premium"
    else:
        band = "Comfortable"

    note = (
        f"Ideas are matched to your {format_inr(cost_per_guest)} per-guest budget ({band}) and your {style_key} vibe."
    )
    return band, cost_per_guest, note


def _filter_by_tier_and_vibe(
    pool: list[TaggedIdea],
    category: str,
    allowed_tiers: set[str],
    style_val: str,
) -> list[str]:
    """Extract ideas matching the category, allowed budget tiers, and vibe."""
    matching_vibe = [
        item.text
        for item in pool
        if item.category == category and item.budget_tier in allowed_tiers and item.vibe == style_val
    ]
    if matching_vibe:
        return matching_vibe
    return [item.text for item in pool if item.category == category and item.budget_tier in allowed_tiers]


def _build_themes_list(
    pool: list[TaggedIdea], allowed_tiers: set[str], style_val: str, recognized: list[str]
) -> list[str]:
    """Assemble final themes list with special requests."""
    candidates = _filter_by_tier_and_vibe(pool, "theme", allowed_tiers, style_val)
    themes = candidates[:3]
    if "sunset outdoor" in recognized and not any("sunset" in t.lower() for t in themes):
        themes.append("Sunset mandap with warm amber uplighting and localized lanterns.")
    if "eco-friendly" in recognized and style_val != "Eco-friendly":
        themes.append("Plastic-free ceremonies using natural clay kulhads and potted plant accents.")
    return themes


def _build_catering_list(
    pool: list[TaggedIdea],
    allowed_tiers: set[str],
    has_food_priority: bool,
    recognized: list[str],
) -> list[str]:
    """Assemble final catering concepts list."""
    candidates = [item.text for item in pool if item.category == "catering" and item.budget_tier in allowed_tiers]
    if has_food_priority:
        prio_items = [
            item.text
            for item in pool
            if item.category == "catering" and item.budget_tier in allowed_tiers and item.priority == "Food"
        ]
        candidates = prio_items + [c for c in candidates if c not in prio_items]

    menu = candidates[:3]
    if "pure Jain" in recognized:
        menu.insert(
            0, "Dedicated pure Jain dining section: Strictly root-vegetable-free recipes, separate kitchen vessels."
        )
    if "Punjabi celebrations" in recognized:
        menu.append("Live Amritsari kulcha counter with tandoori breads, lassi bar, and makki di roti.")
    return menu


def _build_activities_list(func_names: Sequence[str], style_val: str, is_tight: bool) -> list[FunctionActivity]:
    """Assemble ceremony activities mapped to selected functions."""
    activities: list[FunctionActivity] = []
    if "Haldi" in func_names:
        act = (
            "Organic yellow marigold petal shower with traditional brass urlis and dholki folk songs."
            if not is_tight
            else "Family dholak circle with organic turmeric paste and fragrant yellow marigold petals."
        )
        activities.append(FunctionActivity(function="Haldi", activity=act))

    if "Mehendi" in func_names:
        activities.append(
            FunctionActivity(
                function="Mehendi",
                activity="Live bangles counter, customized nail-art, and relaxing organic henna application.",
            )
        )

    if "Sangeet" in func_names:
        act = "Interactive family dance face-off, retro Bollywood medley, and live Punjabi dhol players."
        activities.append(FunctionActivity(function="Sangeet", activity=act))

    if "Wedding" in func_names:
        act = (
            "Auspicious varmala reveal with warm amber lighting and classical shehnai."
            if not is_tight
            else "Heartfelt varmala ceremony surrounded by close family with fresh rose petal shower."
        )
        activities.append(FunctionActivity(function="Wedding", activity=act))

    if "Reception" in func_names:
        activities.append(
            FunctionActivity(
                function="Reception",
                activity="Stately couple stage entry with unplugged acoustic music and celebratory cake cutting.",
            )
        )

    return activities


def _build_hacks_list(
    budget_band: str,
    cost_per_guest: int,
    style_val: str,
    total_budget: int,
    guest_count: int,
    func_names: Sequence[str],
) -> list[str]:
    """Generate budget-smart money-saving recommendations."""
    trim_count = max(10, guest_count // 10)
    trim_savings = trim_count * max(500, int(cost_per_guest * 0.45))
    hacks: list[str] = [
        f"Trimming just {trim_count} guests from your current {guest_count} guest list instantly saves approximately {format_inr(trim_savings)} on food plates and per-head venue charges alone.",
    ]
    if len(func_names) > 3:
        approx_combo = max(25000, int(total_budget * 0.08))
        hacks.append(
            f"Clubbing daytime ceremonies (e.g. Haldi and Mehendi into a unified daytime carnival) saves ~{format_inr(approx_combo)} on separate venue fees and decorator call-out charges."
        )
    if style_val == "Royal/Palace" and budget_band == "Tight":
        approx_venue_disc = max(35000, int(total_budget * 0.12))
        hacks.append(
            f"Opting for an off-peak weekday or morning muhurat slot at a heritage haveli or palace lawn can save up to ~{format_inr(approx_venue_disc)} on rental charges."
        )
    hacks.extend(
        [
            f"Switching from physical boxed wedding cards to designer digital video e-invitations with WhatsApp RSVP saves {format_inr(30000)}–{format_inr(75000)} across {guest_count} guests.",
            "Prioritize locally grown seasonal blooms (marigold, tuberose, and mogra) over imported blooms to reduce floral decoration bills by 30% to 40%.",
            "Negotiate directly with independent local dhol and brass band troupes rather than booking through multiple middlemen agencies.",
        ]
    )
    return hacks


def build_fallback_ideas(
    city: str,
    city_tier: CityTierEnum | str,
    style: WeddingStyleEnum | str,
    functions: Sequence[WeddingFunctionEnum | str],
    priorities: Sequence[PriorityEnum | str],
    special_requests: str | None = None,
    total_budget: int = 1500000,
    guest_count: int = 200,
) -> IdeasPlan:
    """Deterministic rule-based generator for high quality Indian wedding concepts."""
    clean_city = title_case_city(city)
    tier_val = city_tier.value if hasattr(city_tier, "value") else str(city_tier)
    style_val = style.value if hasattr(style, "value") else str(style)
    func_names = [f.value if hasattr(f, "value") else str(f) for f in functions]
    priority_names = [p.value if hasattr(p, "value") else str(p) for p in priorities]
    sanitized_special = sanitize_input_text(special_requests, max_length=120)
    recognized = extract_recognized_special_themes(sanitized_special)

    budget_band, cost_per_guest, note = determine_budget_band(total_budget, guest_count, city_tier, style)
    pool = get_base_idea_pool(clean_city)

    allowed_tiers = (
        {"frugal"}
        if budget_band == "Tight"
        else {"frugal", "standard"}
        if budget_band == "Comfortable"
        else {"frugal", "standard", "premium"}
    )

    themes = _build_themes_list(pool, allowed_tiers, style_val, recognized)
    menu = _build_catering_list(pool, allowed_tiers, "Food" in priority_names, recognized)
    activities = _build_activities_list(func_names, style_val, budget_band == "Tight")

    guest_exp = [item.text for item in pool if item.category == "guest_exp" and item.budget_tier in allowed_tiers][:3]
    hacks = _build_hacks_list(budget_band, cost_per_guest, style_val, total_budget, guest_count, func_names)

    if budget_band == "Tight":

        def _clean_str(text: str) -> str:
            res = text
            for term in FORBIDDEN_PREMIUM_TERMS:
                if term in res.lower():
                    res = res.replace(term, "seasonal floral").replace(term.capitalize(), "Seasonal floral")
            return res

        themes = [_clean_str(t) for t in themes]
        menu = [_clean_str(m) for m in menu]
        guest_exp = [_clean_str(g) for g in guest_exp]
        hacks = [_clean_str(h) for h in hacks]
        for a in activities:
            a.activity = _clean_str(a.activity)

    overview_summary = (
        f"A customized {style_val.lower()} celebration curated for {clean_city} ({tier_val}). "
        f"Harmonizing traditional cultural rituals across {len(func_names)} ceremonies with practical hospitality."
    )
    if recognized:
        overview_summary += f" Tailored for: {', '.join(recognized)}."

    return IdeasPlan(
        overview_summary=normalize_currency_in_text(overview_summary),
        themes_and_decor=[normalize_currency_in_text(t) for t in themes],
        catering_and_menu=[normalize_currency_in_text(m) for m in menu],
        function_activities=[
            FunctionActivity(function=a.function, activity=normalize_currency_in_text(a.activity)) for a in activities
        ],
        guest_experience_ideas=[normalize_currency_in_text(g) for g in guest_exp],
        money_saving_hacks=[normalize_currency_in_text(h) for h in hacks],
        ideas_source="fallback",
        budget_band=budget_band,
        budget_band_note=note,
    )


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
