"""Pydantic data models with strict validation."""
from __future__ import annotations

from datetime import date
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CityTierEnum(StrEnum):
    METRO = "Metro"
    TIER_2 = "Tier-2"
    TIER_3 = "Tier-3"


class WeddingStyleEnum(StrEnum):
    TRADITIONAL = "Traditional"
    ROYAL_PALACE = "Royal/Palace"
    MODERN_MINIMAL = "Modern Minimal"
    DESTINATION = "Destination"
    ECO_FRIENDLY = "Eco-friendly"
    BUDGET_SMART = "Budget-smart"


class WeddingFunctionEnum(StrEnum):
    ENGAGEMENT = "Engagement"
    HALDI = "Haldi"
    MEHENDI = "Mehendi"
    SANGEET = "Sangeet"
    WEDDING = "Wedding"
    RECEPTION = "Reception"


class PriorityEnum(StrEnum):
    FOOD = "Food"
    VENUE_DECOR = "Venue & Decor"
    PHOTOGRAPHY = "Photography"
    MUSIC_ENTERTAINMENT = "Music & Entertainment"
    ATTIRE_JEWELLERY = "Attire & Jewellery"
    GUEST_EXPERIENCE = "Guest Experience"


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


class StrictBaseModel(BaseModel):
    """Base model enforcing strict validation with no extra fields."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class PlanRequest(StrictBaseModel):
    """Client request schema for generating a wedding plan."""

    couple_name: str | None = Field(
        default=None,
        max_length=60,
        description="Optional couple or event name, e.g. 'Priya & Rohan'",
    )
    wedding_date: date = Field(
        description="Wedding date, must be strictly in the future",
    )
    city: str = Field(
        min_length=2,
        max_length=60,
        description="Event city, e.g. 'Jaipur', 'Mumbai', 'Lucknow'",
    )
    city_tier: CityTierEnum = Field(
        description="City classification tier",
    )
    total_budget: int = Field(
        ge=50_000,
        le=100_000_000,
        description="Total wedding budget in INR (50k to 10 Cr)",
    )
    guest_count: int = Field(
        ge=10,
        le=5_000,
        description="Total expected guest count",
    )
    functions: list[WeddingFunctionEnum] = Field(
        min_length=1,
        description="List of celebrated wedding functions",
    )
    style: WeddingStyleEnum = Field(
        description="Selected wedding vibe or theme",
    )
    priorities: list[PriorityEnum] = Field(
        default_factory=list,
        max_length=3,
        description="Up to 3 top priority areas",
    )
    special_requests: str | None = Field(
        default=None,
        max_length=300,
        description="Optional requests (e.g. Pure Jain catering, eco-friendly mandap)",
    )

    @field_validator("wedding_date")
    @classmethod
    def validate_future_date(cls, v: date) -> date:
        today = date.today()
        if v <= today:
            raise ValueError("Wedding date must be strictly in the future.")
        return v

    @field_validator("city")
    @classmethod
    def sanitize_city(cls, v: str) -> str:
        cleaned = " ".join(v.split())
        if not cleaned:
            raise ValueError("City cannot be empty.")
        return cleaned

    @field_validator("special_requests")
    @classmethod
    def sanitize_special_requests(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = " ".join(v.split())
        return cleaned or None


class RecalculateRequest(StrictBaseModel):
    """Client request for instant what-if budget/guest recalculations."""

    wedding_date: date = Field(description="Wedding date")
    city: str = Field(min_length=2, max_length=60)
    city_tier: CityTierEnum
    total_budget: int = Field(ge=50_000, le=100_000_000)
    guest_count: int = Field(ge=10, le=5_000)
    functions: list[WeddingFunctionEnum] = Field(min_length=1)
    style: WeddingStyleEnum
    priorities: list[PriorityEnum] = Field(default_factory=list, max_length=3)

    @field_validator("wedding_date")
    @classmethod
    def validate_future_date(cls, v: date) -> date:
        if v <= date.today():
            raise ValueError("Wedding date must be in the future.")
        return v


class IdeasRequest(StrictBaseModel):
    """Client request for standalone AI ideas regeneration."""

    city: str = Field(min_length=2, max_length=60)
    city_tier: CityTierEnum
    total_budget: int = Field(ge=50_000, le=100_000_000)
    guest_count: int = Field(ge=10, le=5_000)
    functions: list[WeddingFunctionEnum] = Field(min_length=1)
    style: WeddingStyleEnum
    priorities: list[PriorityEnum] = Field(default_factory=list, max_length=3)
    special_requests: str | None = Field(default=None, max_length=300)


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
    ideas_source: str = "gemini"  # "gemini" or "fallback"


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
