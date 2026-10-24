"""Response schemas for wedding planning endpoints."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from backend.app.schemas.requests import StrictBaseModel


class BudgetHealthEnum(StrEnum):
    HEALTHY = "Healthy"
    TIGHT = "Tight"
    UNREALISTIC = "Unrealistic"


class TaskPriorityEnum(StrEnum):
    URGENT = "Urgent"
    HIGH = "High"
    NORMAL = "Normal"


class VendorStatusEnum(StrEnum):
    NOT_STARTED = "Not started"
    CONTACTED = "Contacted"
    BOOKED = "Booked"


class CategoryAllocation(StrictBaseModel):
    category: str
    amount: int
    percentage: float
    description: str


class BudgetPlan(StrictBaseModel):
    total_budget: int
    guest_count: int
    cost_per_guest: int
    health_status: BudgetHealthEnum
    health_description: str
    allocations: list[CategoryAllocation]
    warnings: list[str]
    suggestions: list[str]


class TimelineTask(StrictBaseModel):
    id: str
    title: str
    phase: str
    due_date: str
    priority: TaskPriorityEnum
    related_vendor_category: str | None = None
    description: str
    is_overdue_standard: bool = False


class TimelinePlan(StrictBaseModel):
    days_remaining: int
    is_tight_timeline: bool
    phases: list[str]
    tasks: list[TimelineTask]


class VendorCategoryItem(StrictBaseModel):
    id: str
    name: str
    allocated_budget: int
    lead_time_weeks: int
    advance_payment_guidance: str
    questions_to_ask: list[str]
    contract_must_haves: list[str]
    default_status: VendorStatusEnum = VendorStatusEnum.NOT_STARTED


class VendorPlan(StrictBaseModel):
    categories: list[VendorCategoryItem]


class FunctionActivity(StrictBaseModel):
    function: str
    activity: str


class IdeasPlan(StrictBaseModel):
    overview_summary: str
    themes_and_decor: list[str]
    catering_and_menu: list[str]
    function_activities: list[FunctionActivity]
    guest_experience_ideas: list[str]
    money_saving_hacks: list[str]
    ideas_source: str = "gemini"
    budget_band: str | None = None
    budget_band_note: str | None = None


class OverviewData(StrictBaseModel):
    couple_name: str | None
    wedding_date: str
    city: str
    city_tier: str
    guest_count: int
    total_budget: int
    cost_per_guest: int
    days_remaining: int
    is_tight_timeline: bool
    health_status: BudgetHealthEnum
    summary: str
    key_warnings: list[str]
    tier_min_healthy: int = 1800
    tier_min_tight: int = 1100


class PlanResponse(StrictBaseModel):
    overview: OverviewData
    budget: BudgetPlan
    timeline: TimelinePlan
    vendors: VendorPlan
    ideas: IdeasPlan
    generated_at: str
    disclaimer: str


class RecalculateResponse(StrictBaseModel):
    budget: BudgetPlan
    timeline: TimelinePlan
    vendors: VendorPlan
    days_remaining: int
    is_tight_timeline: bool


class ErrorDetail(StrictBaseModel):
    code: str
    message: str
    details: Any | None = None


class ErrorResponse(StrictBaseModel):
    error: ErrorDetail
