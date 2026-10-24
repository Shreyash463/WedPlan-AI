"""Service layer orchestrating wedding planning use cases."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from backend.app.ai.client import GeminiClientProtocol
from backend.app.ai.ideas import build_fallback_ideas, generate_wedding_ideas
from backend.app.config import Settings, get_settings
from backend.app.engine.planner import build_overview_summary, orchestrate_engine
from backend.app.models import (
    IdeasPlan,
    IdeasRequest,
    PlanRequest,
    PlanResponse,
    RecalculateRequest,
    RecalculateResponse,
)

logger = logging.getLogger("wedplan.services")


class PlanService:
    """Orchestrates plan generation, recalculation, and AI ideas use cases."""

    def __init__(
        self,
        settings: Settings | None = None,
        ai_client: GeminiClientProtocol | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.ai_client = ai_client

    async def generate_full_plan(
        self,
        request: PlanRequest,
        ideas_generator: Any = None,
    ) -> PlanResponse:
        """Execute full plan generation across deterministic engine and AI ideas.

        Args:
            request: Validated PlanRequest from client.
            ideas_generator: Optional generator function override for dependency injection / mocking.

        Returns:
            Fully assembled PlanResponse with overview, budget, timeline, vendors, and ideas.
        """
        budget_plan, timeline_plan, vendor_plan = orchestrate_engine(request)

        gen = ideas_generator or generate_wedding_ideas
        try:
            ideas_plan = await gen(
                city=request.city,
                city_tier=request.city_tier,
                total_budget=request.total_budget,
                guest_count=request.guest_count,
                functions=request.functions,
                style=request.style,
                priorities=request.priorities,
                special_requests=request.special_requests,
                client=self.ai_client,
            )
        except Exception as exc:
            logger.warning("Falling back to deterministic ideas due to error: %s", exc)
            ideas_plan = build_fallback_ideas(
                city=request.city,
                city_tier=request.city_tier,
                style=request.style,
                functions=request.functions,
                priorities=request.priorities,
                special_requests=request.special_requests,
                total_budget=request.total_budget,
                guest_count=request.guest_count,
            )

        overview_data = build_overview_summary(
            request,
            budget_plan,
            timeline_plan,
            vendor_plan=vendor_plan,
        )

        return PlanResponse(
            overview=overview_data,
            budget=budget_plan,
            timeline=timeline_plan,
            vendors=vendor_plan,
            ideas=ideas_plan,
            generated_at=datetime.now(UTC).isoformat(),
            disclaimer=(
                "Estimates are benchmarks derived from Indian wedding market averages. "
                "Confirm binding terms with vendors before signing contracts or paying deposits."
            ),
        )

    def recalculate_plan(self, request: RecalculateRequest) -> RecalculateResponse:
        """Execute pure deterministic recalculation with zero AI latency.

        Args:
            request: Validated RecalculateRequest.

        Returns:
            RecalculateResponse with re-allocated budget, shifted timeline, and updated vendors.
        """
        pseudo_req = PlanRequest(
            couple_name=None,
            wedding_date=request.wedding_date,
            city=request.city,
            city_tier=request.city_tier,
            total_budget=request.total_budget,
            guest_count=request.guest_count,
            functions=request.functions,
            style=request.style,
            priorities=request.priorities,
            special_requests=None,
        )

        budget_plan, timeline_plan, vendor_plan = orchestrate_engine(pseudo_req)

        return RecalculateResponse(
            budget=budget_plan,
            timeline=timeline_plan,
            vendors=vendor_plan,
            days_remaining=timeline_plan.days_remaining,
            is_tight_timeline=timeline_plan.is_tight_timeline,
        )

    async def generate_ideas_standalone(self, request: IdeasRequest) -> IdeasPlan:
        """Regenerate personalized ideas independently.

        Args:
            request: Validated IdeasRequest.

        Returns:
            IdeasPlan containing refreshed themes, menus, and ceremony concepts.
        """
        return await generate_wedding_ideas(
            city=request.city,
            city_tier=request.city_tier,
            total_budget=request.total_budget,
            guest_count=request.guest_count,
            functions=request.functions,
            style=request.style,
            priorities=request.priorities,
            special_requests=request.special_requests,
            client=self.ai_client,
        )


def get_plan_service() -> PlanService:
    """FastAPI Dependency providing PlanService singleton."""
    return PlanService()
