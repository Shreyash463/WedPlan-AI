"""Orchestrator for assembling deterministic engine outputs and wedding plans."""
from __future__ import annotations

from datetime import UTC, datetime

from backend.app.constants import ESTIMATE_DISCLAIMER
from backend.app.engine.budget import generate_budget_plan
from backend.app.engine.timeline import generate_timeline_plan
from backend.app.engine.vendors import generate_vendor_plan
from backend.app.models import (
    IdeasPlan,
    OverviewData,
    PlanRequest,
    PlanResponse,
    RecalculateRequest,
    RecalculateResponse,
)


def build_overview_summary(
    plan_request: PlanRequest,
    budget_plan,
    timeline_plan,
) -> OverviewData:
    """Build high-level overview metrics and status summaries."""
    couple_display = plan_request.couple_name or "Indian Wedding Celebration"
    city_str = f"{plan_request.city} ({plan_request.city_tier.value})"

    summary = (
        f"{couple_display} planning guide in {city_str} for {plan_request.guest_count:,} guests. "
        f"Featuring {len(plan_request.functions)} ceremonies ({', '.join(f.value for f in plan_request.functions)}) "
        f"in a curated {plan_request.style.value} vibe with total budget ₹{plan_request.total_budget:,}."
    )

    return OverviewData(
        couple_name=plan_request.couple_name,
        wedding_date=plan_request.wedding_date.isoformat(),
        city=plan_request.city,
        city_tier=plan_request.city_tier.value,
        guest_count=plan_request.guest_count,
        total_budget=plan_request.total_budget,
        cost_per_guest=budget_plan.cost_per_guest,
        days_remaining=timeline_plan.days_remaining,
        is_tight_timeline=timeline_plan.is_tight_timeline,
        health_status=budget_plan.health_status,
        summary=summary,
        key_warnings=budget_plan.warnings,
    )


def orchestrate_engine(
    request: PlanRequest | RecalculateRequest,
):
    """Run pure deterministic calculations across budget, timeline, and vendors."""
    budget_plan = generate_budget_plan(
        total_budget=request.total_budget,
        guest_count=request.guest_count,
        city_tier=request.city_tier,
        functions=request.functions,
        style=request.style,
        priorities=request.priorities,
    )

    timeline_plan = generate_timeline_plan(
        wedding_date=request.wedding_date,
        functions=request.functions,
        style=request.style,
    )

    vendor_plan = generate_vendor_plan(
        functions=request.functions,
        budget_plan=budget_plan,
    )

    return budget_plan, timeline_plan, vendor_plan


def generate_full_plan(
    request: PlanRequest,
    ideas_plan: IdeasPlan,
) -> PlanResponse:
    """Assemble the complete full wedding plan with all 5 sections."""
    budget_plan, timeline_plan, vendor_plan = orchestrate_engine(request)
    overview = build_overview_summary(request, budget_plan, timeline_plan)

    return PlanResponse(
        overview=overview,
        budget=budget_plan,
        timeline=timeline_plan,
        vendors=vendor_plan,
        ideas=ideas_plan,
        generated_at=datetime.now(UTC).isoformat(),
        disclaimer=ESTIMATE_DISCLAIMER,
    )


def generate_recalculation(request: RecalculateRequest) -> RecalculateResponse:
    """Fast, zero-AI recalculation for what-if budget and guest adjustments."""
    budget_plan, timeline_plan, vendor_plan = orchestrate_engine(request)

    return RecalculateResponse(
        budget=budget_plan,
        timeline=timeline_plan,
        vendors=vendor_plan,
        days_remaining=timeline_plan.days_remaining,
        is_tight_timeline=timeline_plan.is_tight_timeline,
    )
