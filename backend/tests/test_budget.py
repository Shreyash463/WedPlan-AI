"""Unit tests for the budget calculation engine."""
from __future__ import annotations

import random

from backend.app.constants import CATEGORY_FLOORS
from backend.app.engine.budget import (
    allocate_amounts_largest_remainder,
    compute_adjusted_weights,
    evaluate_budget_health,
    generate_budget_plan,
)
from backend.app.models import (
    BudgetHealthEnum,
    CityTierEnum,
    PriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


def test_base_budget_split_sums_to_100():
    """Verify adjusted weights sum to 100% across various configuration permutations."""
    all_funcs = list(WeddingFunctionEnum)
    all_styles = list(WeddingStyleEnum)
    all_priorities = list(PriorityEnum)

    for _ in range(25):
        funcs = random.sample(all_funcs, k=random.randint(1, len(all_funcs)))
        style = random.choice(all_styles)
        priorities = random.sample(all_priorities, k=random.randint(0, 3))

        weights = compute_adjusted_weights(funcs, style, priorities)
        total_weight = sum(weights.values())
        assert abs(total_weight - 100.0) < 0.001, f"Weights sum to {total_weight}, expected 100.0"

        # Check contingency floor (never < 5%)
        assert weights["Contingency"] >= 5.0, "Contingency fell below 5%"

        # Check all floors
        for cat, floor_val in CATEGORY_FLOORS.items():
            assert weights[cat] >= floor_val - 0.001, f"Category {cat} fell below floor {floor_val}"


def test_largest_remainder_exact_budget_sum():
    """Verify that integer allocations sum EXACTLY to total budget for many random values."""
    random.seed(42)
    weights = compute_adjusted_weights(
        [WeddingFunctionEnum.WEDDING, WeddingFunctionEnum.RECEPTION],
        WeddingStyleEnum.TRADITIONAL,
        [PriorityEnum.FOOD, PriorityEnum.VENUE_DECOR],
    )

    test_budgets = [
        50_000,
        77_777,
        153_291,
        1_234_567,
        5_000_000,
        18_923_451,
        100_000_000,
    ] + [random.randint(50_000, 50_000_000) for _ in range(50)]

    for budget in test_budgets:
        results = allocate_amounts_largest_remainder(budget, weights)
        total_allocated = sum(amt for _, amt, _ in results)
        assert total_allocated == budget, (
            f"Allocated sum {total_allocated} != requested budget {budget}"
        )


def test_vibe_adjustments():
    """Verify vibe adjustments skew category allocations appropriately."""
    base_funcs = [WeddingFunctionEnum.WEDDING]

    royal_weights = compute_adjusted_weights(base_funcs, WeddingStyleEnum.ROYAL_PALACE, [])
    budget_weights = compute_adjusted_weights(base_funcs, WeddingStyleEnum.BUDGET_SMART, [])
    dest_weights = compute_adjusted_weights(base_funcs, WeddingStyleEnum.DESTINATION, [])

    # Royal should spend more on Venue than Budget-smart
    assert royal_weights["Venue"] > budget_weights["Venue"]
    # Destination should spend significantly more on Logistics & Stay
    assert dest_weights["Logistics, Transport & Stay"] > royal_weights["Logistics, Transport & Stay"]
    # Budget-smart should maintain strong contingency
    assert budget_weights["Contingency"] >= 5.0


def test_priority_adjustments():
    """Verify top priorities increase their respective target categories."""
    base_funcs = [WeddingFunctionEnum.WEDDING]
    style = WeddingStyleEnum.TRADITIONAL

    food_weights = compute_adjusted_weights(base_funcs, style, [PriorityEnum.FOOD])
    photo_weights = compute_adjusted_weights(base_funcs, style, [PriorityEnum.PHOTOGRAPHY])

    assert food_weights["Catering"] > photo_weights["Catering"]
    assert photo_weights["Photography & Video"] > food_weights["Photography & Video"]


def test_function_adjustments():
    """Verify function selection alters category weights."""
    style = WeddingStyleEnum.TRADITIONAL

    weights_with_mehendi = compute_adjusted_weights(
        [WeddingFunctionEnum.MEHENDI, WeddingFunctionEnum.WEDDING], style, []
    )
    weights_without_mehendi = compute_adjusted_weights(
        [WeddingFunctionEnum.WEDDING], style, []
    )

    assert weights_with_mehendi["Makeup & Mehendi"] > weights_without_mehendi["Makeup & Mehendi"]


def test_budget_health_benchmarks():
    """Verify healthy, tight, and unrealistic tier classifications."""
    funcs = [WeddingFunctionEnum.WEDDING]

    # Metro: Healthy >= 2500, Tight 1500-2499, Unrealistic < 1500
    healthy_status, _, _, _ = evaluate_budget_health(
        total_budget=3_000_000, guest_count=500, city_tier=CityTierEnum.METRO, functions=funcs
    )  # 6,000 / guest
    assert healthy_status == BudgetHealthEnum.HEALTHY

    tight_status, _, warnings, suggestions = evaluate_budget_health(
        total_budget=1_000_000, guest_count=500, city_tier=CityTierEnum.METRO, functions=funcs
    )  # 2,000 / guest
    assert tight_status == BudgetHealthEnum.TIGHT
    assert len(warnings) > 0
    assert len(suggestions) > 0

    unrealistic_status, _, warnings, suggestions = evaluate_budget_health(
        total_budget=500_000, guest_count=500, city_tier=CityTierEnum.METRO, functions=funcs
    )  # 1,000 / guest
    assert unrealistic_status == BudgetHealthEnum.UNREALISTIC
    assert len(warnings) > 0
    assert len(suggestions) > 0


def test_generate_budget_plan():
    """Verify end-to-end BudgetPlan generation model."""
    plan = generate_budget_plan(
        total_budget=2_500_000,
        guest_count=400,
        city_tier=CityTierEnum.TIER_2,
        functions=[WeddingFunctionEnum.SANGEET, WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.ROYAL_PALACE,
        priorities=[PriorityEnum.FOOD, PriorityEnum.VENUE_DECOR],
    )

    assert plan.total_budget == 2_500_000
    assert plan.guest_count == 400
    assert plan.cost_per_guest == 6250
    assert plan.health_status == BudgetHealthEnum.HEALTHY
    assert sum(alloc.amount for alloc in plan.allocations) == 2_500_000
    assert len(plan.allocations) == 10
