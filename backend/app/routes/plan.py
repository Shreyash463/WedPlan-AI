"""Plan, Recalculate, and Ideas endpoints."""
from __future__ import annotations

import logging
import sys
import traceback

from fastapi import APIRouter, Depends, HTTPException, Request, status

from backend.app.ai.ideas import build_fallback_ideas, generate_wedding_ideas
from backend.app.config import settings
from backend.app.engine.planner import generate_full_plan, generate_recalculation
from backend.app.models import (
    IdeasPlan,
    IdeasRequest,
    PlanRequest,
    PlanResponse,
    RecalculateRequest,
    RecalculateResponse,
)
from backend.app.rate_limit import RateLimitMiddleware, SlidingWindowRateLimiter

logger = logging.getLogger("wedplan.routes")

router = APIRouter(prefix="/api", tags=["Wedding Planning"])

# Initialize rate limiters
plan_limiter = SlidingWindowRateLimiter(requests_per_minute=settings.rate_limit_plan)
ideas_limiter = SlidingWindowRateLimiter(requests_per_minute=settings.rate_limit_ideas)
recalc_limiter = SlidingWindowRateLimiter(requests_per_minute=settings.rate_limit_recalculate)

rate_limiter = RateLimitMiddleware(
    {
        "plan": plan_limiter,
        "ideas": ideas_limiter,
        "recalculate": recalc_limiter,
    }
)


def enforce_rate_limit(bucket: str):
    """Dependency for checking sliding-window rate limits per IP."""

    def _check(request: Request):
        violation = rate_limiter.check(request, bucket)
        if violation is not None:
            # Raise exception so standard FastAPI exception handlers can catch or return directly
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded for this endpoint. Please wait before retrying.",
                headers=dict(violation.headers),
            )
        return True

    return _check


@router.get("/health", summary="Health Check")
async def health_check():
    """Liveness health check endpoint with diagnostics."""
    return {
        "status": "ok",
        "gemini_configured": bool(settings.gemini_api_key),
        "model": settings.gemini_model,
        "python": sys.version.split()[0],
    }


@router.post(
    "/plan",
    response_model=PlanResponse,
    summary="Generate Full Wedding Plan",
    dependencies=[Depends(enforce_rate_limit("plan"))],
)
async def create_plan(request: PlanRequest) -> PlanResponse:
    """Generate complete wedding plan including budget split, timeline roadmap, vendor checklist, and personalized ideas."""
    logger.info(
        "Received plan request for city=%s, budget=%s, guests=%s",
        request.city,
        request.total_budget,
        request.guest_count,
    )

    try:
        ideas = await generate_wedding_ideas(
            city=request.city,
            city_tier=request.city_tier,
            total_budget=request.total_budget,
            guest_count=request.guest_count,
            functions=request.functions,
            style=request.style,
            priorities=request.priorities,
            special_requests=request.special_requests,
        )
    except Exception as exc:
        logger.warning(
            "Gemini generation or validation encountered an issue (%s: %s). Falling back gracefully to deterministic ideas engine.",
            type(exc).__name__,
            exc,
        )
        ideas = build_fallback_ideas(
            city=request.city,
            city_tier=request.city_tier,
            style=request.style,
            functions=request.functions,
            priorities=request.priorities,
            special_requests=request.special_requests,
            total_budget=request.total_budget,
            guest_count=request.guest_count,
        )

    try:
        plan = generate_full_plan(request, ideas)
        return plan
    except Exception as exc:
        logger.error("Error compiling plan: %s", type(exc).__name__)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while compiling your wedding plan. Please retry.",
        )


@router.post(
    "/recalculate",
    response_model=RecalculateResponse,
    summary="Instant What-If Recalculation",
    dependencies=[Depends(enforce_rate_limit("recalculate"))],
)
async def recalculate(request: RecalculateRequest) -> RecalculateResponse:
    """Instant deterministic recalculation for what-if budget and guest adjustments with NO external AI call."""
    try:
        result = generate_recalculation(request)
        return result
    except Exception as exc:
        logger.error("Error recalculating plan: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to recalculate budget and timeline metrics.",
        )


@router.post(
    "/ideas",
    response_model=IdeasPlan,
    summary="Regenerate Personalized Ideas",
    dependencies=[Depends(enforce_rate_limit("ideas"))],
)
async def regenerate_ideas(request: IdeasRequest) -> IdeasPlan:
    """Regenerate personalized Indian wedding ideas with stricter rate limiting."""
    try:
        ideas = await generate_wedding_ideas(
            city=request.city,
            city_tier=request.city_tier,
            total_budget=request.total_budget,
            guest_count=request.guest_count,
            functions=request.functions,
            style=request.style,
            priorities=request.priorities,
            special_requests=request.special_requests,
        )
        return ideas
    except Exception as exc:
        logger.warning(
            "Regenerating ideas encountered issue (%s: %s). Falling back gracefully.",
            type(exc).__name__,
            exc,
        )
        return build_fallback_ideas(
            city=request.city,
            city_tier=request.city_tier,
            style=request.style,
            functions=request.functions,
            priorities=request.priorities,
            special_requests=request.special_requests,
            total_budget=request.total_budget,
            guest_count=request.guest_count,
        )
