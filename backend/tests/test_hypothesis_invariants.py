"""Property-based invariant testing using Hypothesis for WedPlan AI domain algorithms.

Validates fundamental mathematical and domain invariants:
1. Budget Sum Invariant: sum of category amounts == total_budget (0 rounding error).
2. Category Non-negativity: every category amount >= 0.
3. Timeline Due Date Monotonicity: pre-wedding tasks due <= wedding_date, all due >= today.
4. Tight Budget Luxury Exclusion: no forbidden luxury terms appear when budget is Tight.
5. Hamilton Largest Remainder Integrity: integer division per guest matches formula.
"""

from datetime import date, timedelta

from hypothesis import given, settings
from hypothesis import strategies as st

from backend.app.ai.ideas import build_fallback_ideas
from backend.app.engine.budget import generate_budget_plan
from backend.app.engine.data.ideas_data import FORBIDDEN_PREMIUM_TERMS
from backend.app.engine.planner import generate_full_plan
from backend.app.engine.timeline import generate_timeline_plan
from backend.app.schemas.requests import (
    CityTierEnum,
    PlanRequest,
    PriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


@settings(max_examples=50, deadline=None)
@given(
    budget=st.integers(min_value=50_000, max_value=100_000_000),
    guests=st.integers(min_value=10, max_value=5000),
    style=st.sampled_from(list(WeddingStyleEnum)),
    city_tier=st.sampled_from(list(CityTierEnum)),
    functions=st.lists(st.sampled_from(list(WeddingFunctionEnum)), min_size=1, max_size=6, unique=True),
    priorities=st.lists(st.sampled_from(list(PriorityEnum)), min_size=1, max_size=3, unique=True),
)
def test_budget_sum_invariant(
    budget: int,
    guests: int,
    style: WeddingStyleEnum,
    city_tier: CityTierEnum,
    functions: list[WeddingFunctionEnum],
    priorities: list[PriorityEnum],
) -> None:
    """Invariant: The sum of category allocations must EXACTLY equal the input total budget."""
    budget_plan = generate_budget_plan(
        total_budget=budget,
        guest_count=guests,
        city_tier=city_tier,
        functions=functions,
        style=style,
        priorities=priorities,
    )
    total_allocated = sum(item.amount for item in budget_plan.allocations)
    assert total_allocated == budget, f"Sum invariant violated: expected {budget}, got {total_allocated}"
    for item in budget_plan.allocations:
        assert item.amount >= 0, f"Negative allocation in {item.category}: {item.amount}"
        assert 0.0 <= item.percentage <= 100.0, f"Invalid percentage in {item.category}: {item.percentage}"


@settings(max_examples=50, deadline=None)
@given(
    days_in_future=st.integers(min_value=1, max_value=730),
    functions=st.lists(st.sampled_from(list(WeddingFunctionEnum)), min_size=1, max_size=6, unique=True),
    style=st.sampled_from(list(WeddingStyleEnum)),
)
def test_timeline_monotonicity_and_bounds(
    days_in_future: int,
    functions: list[WeddingFunctionEnum],
    style: WeddingStyleEnum,
) -> None:
    """Invariant: Pre-wedding tasks must have due dates <= wedding date, and all due dates >= today."""
    today = date(2026, 10, 24)
    target_date = today + timedelta(days=days_in_future)
    timeline_plan = generate_timeline_plan(
        wedding_date=target_date,
        functions=functions,
        style=style,
        current_date=today,
    )
    assert len(timeline_plan.tasks) > 0, "Timeline must produce at least one task"
    for task in timeline_plan.tasks:
        task_date = date.fromisoformat(task.due_date)
        if task.phase != "After Wedding":
            assert task_date <= target_date, (
                f"Task '{task.title}' due date {task_date} exceeds wedding date {target_date}"
            )
        assert task_date >= today, f"Task '{task.title}' due date {task_date} is before today {today}"


@settings(max_examples=30, deadline=None)
@given(
    guests=st.integers(min_value=300, max_value=1000),
    style=st.sampled_from(list(WeddingStyleEnum)),
)
def test_tight_budget_zero_luxury_invariant(guests: int, style: WeddingStyleEnum) -> None:
    """Invariant: Any plan evaluated as Tight must contain ZERO forbidden premium/luxury terms."""
    # Under 1,000 INR per guest is guaranteed Tight in Metro
    low_budget = guests * 600
    plan_req = PlanRequest(
        wedding_date=(date(2026, 10, 24) + timedelta(days=180)).isoformat(),
        city="Delhi",
        city_tier=CityTierEnum.METRO,
        total_budget=low_budget,
        guest_count=guests,
        functions=[WeddingFunctionEnum.HALDI, WeddingFunctionEnum.WEDDING],
        style=style,
        priorities=[PriorityEnum.FOOD],
    )
    ideas = build_fallback_ideas(
        city="Delhi",
        city_tier=CityTierEnum.METRO,
        style=style,
        functions=[WeddingFunctionEnum.HALDI, WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.FOOD],
        special_requests=None,
        total_budget=low_budget,
        guest_count=guests,
    )
    full_plan = generate_full_plan(plan_req, ideas_plan=ideas, today=date(2026, 10, 24))
    assert full_plan.overview.health_status in ("Tight", "Unrealistic")

    # Search all text fields in ideas for forbidden terms
    plan_ideas = full_plan.ideas
    activity_texts = [f"{a.function} {a.activity}" for a in plan_ideas.function_activities]
    combined_ideas_text = " ".join(
        [plan_ideas.overview_summary or ""]
        + plan_ideas.themes_and_decor
        + plan_ideas.catering_and_menu
        + plan_ideas.guest_experience_ideas
        + plan_ideas.money_saving_hacks
        + activity_texts
    ).lower()

    for forbidden in FORBIDDEN_PREMIUM_TERMS:
        assert forbidden not in combined_ideas_text, (
            f"Tight plan contained forbidden luxury term '{forbidden}' in ideas: {combined_ideas_text}"
        )


@settings(max_examples=30, deadline=None)
@given(
    budget=st.integers(min_value=100_000, max_value=50_000_000),
    guests=st.integers(min_value=20, max_value=1500),
)
def test_budget_plan_health_and_per_guest(budget: int, guests: int) -> None:
    """Invariant: Per-guest computation is accurate and health band is mathematically sound."""
    plan = generate_budget_plan(
        total_budget=budget,
        guest_count=guests,
        city_tier=CityTierEnum.TIER_2,
        style=WeddingStyleEnum.TRADITIONAL,
        functions=[WeddingFunctionEnum.WEDDING],
        priorities=[PriorityEnum.FOOD],
    )
    expected_per_guest = budget // max(guests, 1)
    assert plan.cost_per_guest == expected_per_guest
    assert plan.health_status in ("Healthy", "Tight", "Unrealistic")
    assert plan.total_budget == budget
