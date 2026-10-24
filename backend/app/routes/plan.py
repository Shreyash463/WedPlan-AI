"""Thin HTTP routing layer delegating wedding planning use cases to PlanService."""

from __future__ import annotations

import logging
import sys
from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException, Request, status

from backend.app.ai.ideas import generate_wedding_ideas
from backend.app.config import Settings, get_settings
from backend.app.models import (
    IdeasPlan,
    IdeasRequest,
    PlanRequest,
    PlanResponse,
    RecalculateRequest,
    RecalculateResponse,
)
from backend.app.rate_limit import RateLimitMiddleware, SlidingWindowRateLimiter
from backend.app.services.plan_service import PlanService, get_plan_service

logger = logging.getLogger("wedplan.routes")

router = APIRouter(prefix="/api", tags=["Wedding Planning"])

# Initialize sliding-window rate limiters
_settings = get_settings()
plan_limiter = SlidingWindowRateLimiter(requests_per_minute=_settings.rate_limit_plan)
ideas_limiter = SlidingWindowRateLimiter(requests_per_minute=_settings.rate_limit_ideas)
recalc_limiter = SlidingWindowRateLimiter(requests_per_minute=_settings.rate_limit_recalculate)

rate_limiter = RateLimitMiddleware(
    {
        "plan": plan_limiter,
        "ideas": ideas_limiter,
        "recalculate": recalc_limiter,
    }
)


def enforce_rate_limit(bucket: str) -> Callable[[Request], bool]:
    """FastAPI dependency factory enforcing per-endpoint rate limits."""

    def _check(request: Request) -> bool:
        violation = rate_limiter.check(request, bucket)
        if violation is not None:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded for this endpoint. Please wait before retrying.",
                headers=dict(violation.headers),
            )
        return True

    return _check


@router.get("/health", summary="Health Check")
async def health_check(cfg: Settings = Depends(get_settings)) -> dict[str, str | bool]:
    """Liveness health check endpoint with diagnostics."""
    return {
        "status": "ok",
        "gemini_configured": bool(cfg.gemini_api_key),
        "model": cfg.gemini_model,
        "python": sys.version.split()[0],
    }


@router.post(
    "/plan",
    response_model=PlanResponse,
    summary="Generate Full Wedding Plan",
    dependencies=[Depends(enforce_rate_limit("plan"))],
)
async def create_plan(
    request: PlanRequest,
    service: PlanService = Depends(get_plan_service),
) -> PlanResponse:
    """Generate complete wedding plan including budget, timeline, vendors, and ideas."""
    logger.info(
        "Received plan request: city=%s, budget=%s, guests=%s", request.city, request.total_budget, request.guest_count
    )
    return await service.generate_full_plan(request, ideas_generator=generate_wedding_ideas)


@router.post(
    "/recalculate",
    response_model=RecalculateResponse,
    summary="Instant What-If Recalculation",
    dependencies=[Depends(enforce_rate_limit("recalculate"))],
)
async def recalculate(
    request: RecalculateRequest,
    service: PlanService = Depends(get_plan_service),
) -> RecalculateResponse:
    """Instant deterministic recalculation with zero AI latency."""
    return service.recalculate_plan(request)


@router.post(
    "/ideas",
    response_model=IdeasPlan,
    summary="Regenerate Personalized Ideas",
    dependencies=[Depends(enforce_rate_limit("ideas"))],
)
async def regenerate_ideas(
    request: IdeasRequest,
    service: PlanService = Depends(get_plan_service),
) -> IdeasPlan:
    """Regenerate personalized Indian wedding ideas."""
    return await service.generate_ideas_standalone(request)
