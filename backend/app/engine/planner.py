"""Orchestrator for assembling deterministic engine outputs and wedding plans."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from backend.app.constants import CITY_TIER_BENCHMARKS, ESTIMATE_DISCLAIMER
from backend.app.engine.budget import generate_budget_plan
from backend.app.engine.formatters import format_inr, title_case_city
from backend.app.engine.timeline import generate_timeline_plan
from backend.app.engine.vendors import generate_vendor_plan
from backend.app.models import (
    BudgetPlan,
    IdeasPlan,
    OverviewData,
    PlanRequest,
    PlanResponse,
    RecalculateRequest,
    RecalculateResponse,
    TimelinePlan,
    VendorCategoryItem,
    VendorPlan,
)

VENDOR_IMPACT_PRIORITY: tuple[str, ...] = (
    "venue",
    "cater",
    "photo",
    "decor",
    "attire",
    "makeup",
    "mehendi",
    "music",
    "pandit",
    "invitation",
)


def _vendor_impact_rank(name: str) -> int:
    """Return an impact rank (1 is highest priority) for booking urgency."""
    n = name.lower()
    for idx, token in enumerate(VENDOR_IMPACT_PRIORITY):
        if token in n:
            return idx + 1
    return len(VENDOR_IMPACT_PRIORITY) + 1


def _short_vendor_name(name: str) -> str:
    """Produce concise name for summary alert."""
    n = name.lower()
    mapping = (
        ("venue", "Venue"),
        ("cater", "Caterer"),
        ("photo", "Photographer"),
        ("decor", "Decorator"),
        ("attire", "Attire"),
        ("makeup", "Makeup & Hair"),
        ("mehendi", "Mehendi Artist"),
        ("music", "DJ & Music"),
        ("pandit", "Pandit"),
        ("invitation", "Invitations"),
    )
    for token, label in mapping:
        if token in n:
            return label
    return name


def _calculate_overdue_warning(
    categories: list[VendorCategoryItem],
    wedding_date: date,
    today: date,
) -> str | None:
    """Calculate compact overdue vendor alert."""
    overdue = [c for c in categories if (wedding_date - timedelta(weeks=c.lead_time_weeks)) < today]
    if not overdue:
        return None

    overdue_sorted = sorted(overdue, key=lambda c: _vendor_impact_rank(c.name))
    top_names = [_short_vendor_name(c.name) for c in overdue_sorted[:3]]
    return f"{len(overdue)} of {len(categories)} vendors are past their standard booking window. Book these first: {', '.join(top_names)}."


def build_overview_summary(
    plan_request: PlanRequest,
    budget_plan: BudgetPlan,
    timeline_plan: TimelinePlan,
    vendor_plan: VendorPlan | None = None,
    today: date | None = None,
) -> OverviewData:
    """Build high-level overview metrics and natural executive summary."""
    ref_today = today or date.today()
    city_name = title_case_city(plan_request.city)
    func_count = len(plan_request.functions)
    couple_prefix = f"{plan_request.couple_name}'s " if plan_request.couple_name else "A "
    priority_str = (
        f" prioritizing {', '.join(p.value for p in plan_request.priorities)}" if plan_request.priorities else ""
    )

    venue_pct = next((a.percentage for a in budget_plan.allocations if a.category == "Venue"), 18.0)
    catering_pct = next((a.percentage for a in budget_plan.allocations if a.category == "Catering"), 30.0)
    hospitality_pct = round(venue_pct + catering_pct)

    days_str = (
        f"With {timeline_plan.days_remaining} days to go"
        if timeline_plan.days_remaining > 0
        else "With your wedding day here"
    )

    summary = (
        f"{couple_prefix}{func_count}-function {plan_request.style.value} celebration in {city_name} "
        f"for {plan_request.guest_count:,} guests with a total budget of {format_inr(plan_request.total_budget)} "
        f"({format_inr(budget_plan.cost_per_guest)} per guest){priority_str}. "
        f"The budget health is {budget_plan.health_status.value} for a {plan_request.city_tier.value} destination, "
        f"with {hospitality_pct}% allocated to core venue and catering hospitality. "
        f"{days_str}, primary milestones are locked in your tailored timeline."
    )

    tier_info = CITY_TIER_BENCHMARKS.get(plan_request.city_tier.value, CITY_TIER_BENCHMARKS["Tier-2"])
    key_warnings = list(budget_plan.warnings)

    if vendor_plan is not None:
        warning = _calculate_overdue_warning(vendor_plan.categories, plan_request.wedding_date, ref_today)
        if warning:
            key_warnings.append(warning)

    return OverviewData(
        couple_name=plan_request.couple_name,
        wedding_date=plan_request.wedding_date.isoformat(),
        city=city_name,
        city_tier=plan_request.city_tier.value,
        guest_count=plan_request.guest_count,
        total_budget=plan_request.total_budget,
        cost_per_guest=budget_plan.cost_per_guest,
        days_remaining=timeline_plan.days_remaining,
        is_tight_timeline=timeline_plan.is_tight_timeline,
        health_status=budget_plan.health_status,
        summary=summary,
        key_warnings=key_warnings,
        tier_min_healthy=tier_info["healthy_min"],
        tier_min_tight=tier_info["tight_min"],
    )


def orchestrate_engine(
    request: PlanRequest | RecalculateRequest,
    today: date | None = None,
) -> tuple[BudgetPlan, TimelinePlan, VendorPlan]:
    """Run pure deterministic calculations across budget, timeline, and vendors."""
    budget_plan = generate_budget_plan(
        total_budget=request.total_budget,
        guest_count=request.guest_count,
        city_tier=request.city_tier,
        functions=request.functions,
        style=request.style,
        priorities=request.priorities,
    )

    from backend.app.ai.ideas import determine_budget_band

    budget_band, _, _ = determine_budget_band(
        total_budget=request.total_budget,
        guest_count=request.guest_count,
        city_tier=request.city_tier,
        style=request.style,
    )

    timeline_plan = generate_timeline_plan(
        wedding_date=request.wedding_date,
        functions=request.functions,
        style=request.style,
        current_date=today,
        budget_band=budget_band,
    )

    vendor_plan = generate_vendor_plan(
        functions=request.functions,
        budget_plan=budget_plan,
        budget_band=budget_band,
        style=request.style,
    )

    return budget_plan, timeline_plan, vendor_plan


def generate_full_plan(
    request: PlanRequest,
    ideas_plan: IdeasPlan,
    today: date | None = None,
) -> PlanResponse:
    """Assemble the complete full wedding plan with all 5 sections."""
    budget_plan, timeline_plan, vendor_plan = orchestrate_engine(request, today=today)
    overview = build_overview_summary(request, budget_plan, timeline_plan, vendor_plan=vendor_plan, today=today)

    return PlanResponse(
        overview=overview,
        budget=budget_plan,
        timeline=timeline_plan,
        vendors=vendor_plan,
        ideas=ideas_plan,
        generated_at=datetime.now(UTC).isoformat(),
        disclaimer=ESTIMATE_DISCLAIMER,
    )


def generate_recalculation(
    request: RecalculateRequest,
    today: date | None = None,
) -> RecalculateResponse:
    """Fast, zero-AI recalculation for what-if budget and guest adjustments."""
    budget_plan, timeline_plan, vendor_plan = orchestrate_engine(request, today=today)

    return RecalculateResponse(
        budget=budget_plan,
        timeline=timeline_plan,
        vendors=vendor_plan,
        days_remaining=timeline_plan.days_remaining,
        is_tight_timeline=timeline_plan.is_tight_timeline,
    )
