"""Pure deterministic engine functions for Indian wedding budget allocation."""

from __future__ import annotations

import math

from backend.app.constants import (
    BASE_BUDGET_SPLIT,
    CATEGORY_FLOORS,
    CITY_TIER_BENCHMARKS,
    PRIORITY_WEIGHT_DELTAS,
    STYLE_WEIGHT_DELTAS,
)
from backend.app.engine.formatters import format_inr
from backend.app.models import (
    BudgetHealthEnum,
    BudgetPlan,
    CategoryAllocation,
    CityTierEnum,
    PriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)

CATEGORY_DESCRIPTIONS: dict[str, str] = {
    "Venue": "Banquet hall, lawn, palace rental, mandap space, and lighting setup.",
    "Catering": "Live food stations, regional delicacies, sweets (mithai), mocktails, and service.",
    "Decor & Florals": "Stage floral arrangements, mandap decor, entrance walkway, and ambient lighting.",
    "Photography & Video": "Pre-wedding shoot, candid wedding photography, traditional video, and drone coverage.",
    "Attire & Jewellery": "Bridal lehengas, groom sherwanis, function wear, and accessories rental/purchase.",
    "Music & Entertainment": "DJ, dhol players for baraat, sound system, and Sangeet choreographer.",
    "Invitations & Stationery": "Boxed/digital wedding cards, RSVP management, itinerary cards, and luggage tags.",
    "Makeup & Mehendi": "Bridal makeup artist (MUA), family hair styling, and organic bridal mehendi artists.",
    "Logistics, Transport & Stay": "Guest airport shuttles, tempo travellers, and hotel room blocking.",
    "Contingency": "Emergency buffer for overtime hours, extra guest plates, weather pivots, and tips/dakshina.",
}


def compute_adjusted_weights(
    functions: list[WeddingFunctionEnum],
    style: WeddingStyleEnum,
    priorities: list[PriorityEnum],
) -> dict[str, float]:
    """Calculate normalized percentage weights based on selected functions, style, and priorities.

    Enforces minimum floors and ensures Contingency is never below 5.0%.
    """
    weights = dict(BASE_BUDGET_SPLIT)
    function_names = [f.value for f in functions]
    style_name = style.value
    priority_names = [p.value for p in priorities]

    # 1. Apply Function-specific adjustments
    if "Mehendi" in function_names:
        weights["Makeup & Mehendi"] += 1.5
    else:
        weights["Makeup & Mehendi"] -= 1.5

    if "Sangeet" in function_names:
        weights["Music & Entertainment"] += 2.0
    else:
        weights["Music & Entertainment"] -= 1.0

    if len(function_names) >= 5:
        weights["Catering"] += 2.0
        weights["Decor & Florals"] += 2.0
        weights["Attire & Jewellery"] += 1.0
    elif len(function_names) <= 2:
        weights["Decor & Florals"] -= 2.0
        weights["Music & Entertainment"] -= 1.5
        weights["Venue"] -= 1.5

    # 2. Apply Style/Vibe adjustments
    style_deltas = STYLE_WEIGHT_DELTAS.get(style_name, {})
    for cat, delta in style_deltas.items():
        if cat in weights:
            weights[cat] += delta

    # 3. Apply Priority adjustments
    for priority in priority_names:
        p_deltas = PRIORITY_WEIGHT_DELTAS.get(priority, {})
        for cat, delta in p_deltas.items():
            if cat in weights:
                weights[cat] += delta

    # 4. Iteratively enforce category floors and normalize to exactly 100.0%
    # Guarantees: every category >= floor, Contingency >= 5.0%, and sum == 100.0%
    for _ in range(10):
        # Enforce floors
        for cat, floor_val in CATEGORY_FLOORS.items():
            weights[cat] = max(weights[cat], floor_val)

        weights["Contingency"] = max(weights["Contingency"], 5.0)

        current_total = sum(weights.values())
        if abs(current_total - 100.0) < 1e-5:
            break

        if current_total > 100.0:
            excess = current_total - 100.0
            # Identify categories strictly above their floor
            flexible = {
                c: weights[c] - CATEGORY_FLOORS.get(c, 0.0) for c in weights if weights[c] > CATEGORY_FLOORS.get(c, 0.0)
            }
            flex_sum = sum(flexible.values())
            if flex_sum > 0:
                for c in flexible:
                    weights[c] -= excess * (flexible[c] / flex_sum)
            else:
                break
        else:
            shortfall = 100.0 - current_total
            total_w = sum(weights.values())
            if total_w > 0:
                for c in weights:
                    weights[c] += shortfall * (weights[c] / total_w)

    return weights


def allocate_amounts_largest_remainder(total_budget: int, weights: dict[str, float]) -> list[tuple[str, int, float]]:
    """Convert percentage weights to exact integer INR amounts using the Largest Remainder Method (Hamilton/Hare).

    Guarantees that sum(amounts) == total_budget without losing a single rupee.
    """
    categories = list(weights.keys())
    raw_amounts = [weights[c] * total_budget / 100.0 for c in categories]
    int_amounts = [math.floor(val) for val in raw_amounts]

    remainder = total_budget - sum(int_amounts)
    fractions = [(i, raw_amounts[i] - int_amounts[i]) for i in range(len(categories))]
    # Sort descending by fractional part
    fractions.sort(key=lambda item: item[1], reverse=True)

    for i in range(remainder):
        idx = fractions[i][0]
        int_amounts[idx] += 1

    results: list[tuple[str, int, float]] = []
    for i, cat in enumerate(categories):
        amt = int_amounts[i]
        pct = round((amt / total_budget) * 100.0, 2)
        results.append((cat, amt, pct))

    return results


def evaluate_budget_health(
    total_budget: int,
    guest_count: int,
    city_tier: CityTierEnum,
    functions: list[WeddingFunctionEnum],
) -> tuple[BudgetHealthEnum, str, list[str], list[str]]:
    """Determine budget health status, warnings, and concrete suggestions based on city benchmarks."""
    cost_per_guest = total_budget // max(guest_count, 1)
    tier_info = CITY_TIER_BENCHMARKS.get(city_tier.value, CITY_TIER_BENCHMARKS["Tier-2"])
    healthy_min = tier_info["healthy_min"]
    tight_min = tier_info["tight_min"]

    warnings: list[str] = []
    suggestions: list[str] = []

    if cost_per_guest >= healthy_min:
        status = BudgetHealthEnum.HEALTHY
        desc = (
            f"Comfortable budget of {format_inr(cost_per_guest)} per guest for a {city_tier.value} wedding. "
            f"Covers standard Indian wedding hospitality, premium catering, and elegant venue decor."
        )
    elif cost_per_guest >= tight_min:
        status = BudgetHealthEnum.TIGHT
        desc = (
            f"Tight budget of {format_inr(cost_per_guest)} per guest for {city_tier.value} tier. "
            f"Achievable with disciplined vendor selection and focused guest list management."
        )
        warnings.append(
            f"Per-guest spend ({format_inr(cost_per_guest)}) is near the lower boundary for {city_tier.value}."
        )
        if len(functions) >= 5:
            warnings.append(
                f"Hosting {len(functions)} distinct functions on a tight per-guest budget may strain decor and catering quality."
            )
        target_guests = total_budget // healthy_min
        if target_guests < guest_count:
            suggestions.append(
                f"Trimming guest count from {guest_count} to ~{target_guests} would elevate your per-guest spend to a comfortable {format_inr(healthy_min)}."
            )
        if len(functions) > 3:
            approx_function_cost = int(total_budget * 0.12)
            suggestions.append(
                f"Clubbing Haldi and Mehendi into a combined daytime carnival can free ~{format_inr(approx_function_cost)} for premium wedding day catering."
            )
    else:
        status = BudgetHealthEnum.UNREALISTIC
        desc = (
            f"Unrealistic budget of {format_inr(cost_per_guest)} per guest for {city_tier.value} tier. "
            f"Standard banquet venues and traditional catering menus in this tier typically start at {format_inr(tight_min)}+ per guest."
        )
        warnings.append(
            f"Severe budget strain: {format_inr(cost_per_guest)} per guest is significantly below the minimum viable benchmark ({format_inr(tight_min)}) for {city_tier.value}."
        )
        warnings.append(
            "Catering and venue rental alone will likely consume over 70% of this budget unless guest numbers are reduced."
        )
        target_healthy = total_budget // healthy_min
        target_viable = total_budget // tight_min
        suggestions.append(
            f"To achieve a healthy execution, cap guest invitations at ~{target_healthy} guests (or ~{target_viable} for a budget-smart event)."
        )
        suggestions.append(
            "Consider hosting ceremonies at a home courtyard, temple hall, or ancestral community venue to save up to 25% on commercial banquet rental."
        )
        suggestions.append(
            f"Focus on digital video invitations (e-invites) rather than physical boxed invitations to save {format_inr(30000)}–{format_inr(80000)}."
        )

    return status, desc, warnings, suggestions


def generate_budget_plan(
    total_budget: int,
    guest_count: int,
    city_tier: CityTierEnum,
    functions: list[WeddingFunctionEnum],
    style: WeddingStyleEnum,
    priorities: list[PriorityEnum],
) -> BudgetPlan:
    """Generate complete budget breakdown, health status, and suggestions."""
    weights = compute_adjusted_weights(functions, style, priorities)
    allocated_tuples = allocate_amounts_largest_remainder(total_budget, weights)

    allocations: list[CategoryAllocation] = []
    for cat, amt, pct in allocated_tuples:
        allocations.append(
            CategoryAllocation(
                category=cat,
                amount=amt,
                percentage=pct,
                description=CATEGORY_DESCRIPTIONS.get(cat, ""),
            )
        )

    health_status, health_desc, warnings, suggestions = evaluate_budget_health(
        total_budget, guest_count, city_tier, functions
    )
    cost_per_guest = total_budget // max(guest_count, 1)

    return BudgetPlan(
        total_budget=total_budget,
        guest_count=guest_count,
        cost_per_guest=cost_per_guest,
        health_status=health_status,
        health_description=health_desc,
        allocations=allocations,
        warnings=warnings,
        suggestions=suggestions,
    )
