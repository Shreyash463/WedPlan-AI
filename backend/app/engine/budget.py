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
from backend.app.engine.data.budget_data import CATEGORY_DESCRIPTIONS
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


def _apply_function_deltas(weights: dict[str, float], function_names: list[str]) -> None:
    """Adjust weights based on ceremony presence."""
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


def _enforce_floors_and_normalize(weights: dict[str, float]) -> dict[str, float]:
    """Iteratively enforce minimum floors and renormalize to 100.0%."""
    for _ in range(10):
        for cat, floor_val in CATEGORY_FLOORS.items():
            weights[cat] = max(weights[cat], floor_val)
        weights["Contingency"] = max(weights["Contingency"], 5.0)

        current_total = sum(weights.values())
        if abs(current_total - 100.0) < 1e-5:
            break

        if current_total > 100.0:
            excess = current_total - 100.0
            flexible = {
                c: weights[c] - CATEGORY_FLOORS.get(c, 0.0) for c in weights if weights[c] > CATEGORY_FLOORS.get(c, 0.0)
            }
            flex_sum = sum(flexible.values())
            if flex_sum > 0:
                for c, flex_val in flexible.items():
                    weights[c] -= excess * (flex_val / flex_sum)
            else:
                break
        else:
            shortfall = 100.0 - current_total
            total_w = sum(weights.values())
            if total_w > 0:
                for c, w_val in weights.items():
                    weights[c] += shortfall * (w_val / total_w)
    return weights


def compute_adjusted_weights(
    functions: list[WeddingFunctionEnum],
    style: WeddingStyleEnum,
    priorities: list[PriorityEnum],
) -> dict[str, float]:
    """Calculate normalized percentage weights based on selected functions, style, and priorities."""
    weights = dict(BASE_BUDGET_SPLIT)
    function_names = [f.value for f in functions]
    _apply_function_deltas(weights, function_names)

    for cat, delta in STYLE_WEIGHT_DELTAS.get(style.value, {}).items():
        if cat in weights:
            weights[cat] += delta

    for priority in [p.value for p in priorities]:
        for cat, delta in PRIORITY_WEIGHT_DELTAS.get(priority, {}).items():
            if cat in weights:
                weights[cat] += delta

    return _enforce_floors_and_normalize(weights)


def allocate_amounts_largest_remainder(total_budget: int, weights: dict[str, float]) -> list[tuple[str, int, float]]:
    """Convert percentage weights to exact integer INR amounts using the Largest Remainder Method."""
    categories = list(weights.keys())
    raw_amounts = [weights[c] * total_budget / 100.0 for c in categories]
    int_amounts = [math.floor(val) for val in raw_amounts]

    remainder = total_budget - sum(int_amounts)
    fractions = sorted(
        [(i, raw_amounts[i] - int_amounts[i]) for i in range(len(categories))], key=lambda x: x[1], reverse=True
    )

    for i in range(remainder):
        idx = fractions[i][0]
        int_amounts[idx] += 1

    return [
        (cat, int_amounts[i], round((int_amounts[i] / total_budget) * 100.0, 2)) for i, cat in enumerate(categories)
    ]


def _evaluate_tight_budget(
    total_budget: int,
    guest_count: int,
    cost_per_guest: int,
    city_tier: str,
    healthy_min: int,
    func_count: int,
) -> tuple[str, list[str], list[str]]:
    """Build guidance for Tight budget health."""
    desc = f"Tight budget of {format_inr(cost_per_guest)} per guest for {city_tier} tier. Achievable with disciplined vendor selection."
    warnings = [f"Per-guest spend ({format_inr(cost_per_guest)}) is near the lower boundary for {city_tier}."]
    if func_count >= 5:
        warnings.append(
            f"Hosting {func_count} distinct functions on a tight per-guest budget may strain decor and catering quality."
        )

    target_guests = total_budget // healthy_min
    suggestions = [
        f"Trimming guest count from {guest_count} to ~{target_guests} elevates per-guest spend to a comfortable {format_inr(healthy_min)}."
    ]
    if func_count > 3:
        approx_function_cost = int(total_budget * 0.12)
        suggestions.append(
            f"Clubbing Haldi and Mehendi into a combined daytime carnival can free ~{format_inr(approx_function_cost)} for catering."
        )
    return desc, warnings, suggestions


def _evaluate_unrealistic_budget(
    total_budget: int,
    cost_per_guest: int,
    city_tier: str,
    healthy_min: int,
    tight_min: int,
) -> tuple[str, list[str], list[str]]:
    """Build guidance for Unrealistic budget health."""
    desc = f"Unrealistic budget of {format_inr(cost_per_guest)} per guest for {city_tier} tier. Banquet venues typically start at {format_inr(tight_min)}+ per guest."
    warnings = [
        f"Severe budget strain: {format_inr(cost_per_guest)} per guest is significantly below the minimum viable benchmark ({format_inr(tight_min)}) for {city_tier}.",
        "Catering and venue rental alone will likely consume over 70% of this budget unless guest numbers are reduced.",
    ]
    target_healthy = total_budget // healthy_min
    target_viable = total_budget // tight_min
    suggestions = [
        f"To achieve a healthy execution, cap guest invitations at ~{target_healthy} guests (or ~{target_viable} for a budget-smart event).",
        "Consider hosting ceremonies at a home courtyard, temple hall, or ancestral community venue to save on commercial banquet rental.",
        f"Focus on digital video invitations (e-invites) rather than physical boxed invitations to save {format_inr(30000)}–{format_inr(80000)}.",
    ]
    return desc, warnings, suggestions


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

    if cost_per_guest >= healthy_min:
        desc = f"Comfortable budget of {format_inr(cost_per_guest)} per guest for a {city_tier.value} wedding. Covers standard Indian wedding hospitality and catering."
        return BudgetHealthEnum.HEALTHY, desc, [], []

    if cost_per_guest >= tight_min:
        desc, warnings, suggestions = _evaluate_tight_budget(
            total_budget, guest_count, cost_per_guest, city_tier.value, healthy_min, len(functions)
        )
        return BudgetHealthEnum.TIGHT, desc, warnings, suggestions

    desc, warnings, suggestions = _evaluate_unrealistic_budget(
        total_budget, cost_per_guest, city_tier.value, healthy_min, tight_min
    )
    return BudgetHealthEnum.UNREALISTIC, desc, warnings, suggestions


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

    allocations = [
        CategoryAllocation(
            category=cat,
            amount=amt,
            percentage=pct,
            description=CATEGORY_DESCRIPTIONS.get(cat, ""),
        )
        for cat, amt, pct in allocated_tuples
    ]

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
