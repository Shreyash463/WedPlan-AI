"""Client request schemas for wedding planning endpoints."""

from __future__ import annotations

from datetime import date
from enum import StrEnum

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


class StrictBaseModel(BaseModel):
    """Base model enforcing strict validation with no extra fields."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class PlanRequest(StrictBaseModel):
    """Client request schema for generating a wedding plan."""

    couple_name: str | None = Field(default=None, max_length=60)
    wedding_date: date = Field(description="Wedding date, must be strictly in the future")
    city: str = Field(min_length=2, max_length=60)
    city_tier: CityTierEnum
    total_budget: int = Field(ge=50_000, le=100_000_000)
    guest_count: int = Field(ge=10, le=5_000)
    functions: list[WeddingFunctionEnum] = Field(min_length=1)
    style: WeddingStyleEnum
    priorities: list[PriorityEnum] = Field(default_factory=list, max_length=3)
    special_requests: str | None = Field(default=None, max_length=300)

    @field_validator("couple_name")
    @classmethod
    def sanitize_couple_name(cls, v: str | None) -> str | None:
        from backend.app.engine.formatters import format_couple_name

        return format_couple_name(v)

    @field_validator("wedding_date")
    @classmethod
    def validate_future_date(cls, v: date) -> date:
        if v <= date.today():
            raise ValueError("Wedding date must be strictly in the future.")
        return v

    @field_validator("city")
    @classmethod
    def sanitize_city(cls, v: str) -> str:
        from backend.app.engine.formatters import title_case_city

        cleaned = title_case_city(v)
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

    wedding_date: date
    city: str = Field(min_length=2, max_length=60)
    city_tier: CityTierEnum
    total_budget: int = Field(ge=50_000, le=100_000_000)
    guest_count: int = Field(ge=10, le=5_000)
    functions: list[WeddingFunctionEnum] = Field(min_length=1)
    style: WeddingStyleEnum
    priorities: list[PriorityEnum] = Field(default_factory=list, max_length=3)

    @field_validator("city")
    @classmethod
    def sanitize_city(cls, v: str) -> str:
        from backend.app.engine.formatters import title_case_city

        cleaned = title_case_city(v)
        if not cleaned:
            raise ValueError("City cannot be empty.")
        return cleaned

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

    @field_validator("city")
    @classmethod
    def sanitize_city(cls, v: str) -> str:
        from backend.app.engine.formatters import title_case_city

        cleaned = title_case_city(v)
        if not cleaned:
            raise ValueError("City cannot be empty.")
        return cleaned
