"""Data models and schemas for WedPlan AI.

All schemas are structured into `backend.app.schemas.requests` and
`backend.app.schemas.responses`, and re-exported here for full backwards compatibility.
"""

from __future__ import annotations

from backend.app.schemas.requests import (
    CityTierEnum,
    IdeasRequest,
    PlanRequest,
    PriorityEnum,
    RecalculateRequest,
    StrictBaseModel,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)
from backend.app.schemas.responses import (
    BudgetHealthEnum,
    BudgetPlan,
    CategoryAllocation,
    ErrorDetail,
    ErrorResponse,
    FunctionActivity,
    IdeasPlan,
    OverviewData,
    PlanResponse,
    RecalculateResponse,
    TaskPriorityEnum,
    TimelinePlan,
    TimelineTask,
    VendorCategoryItem,
    VendorPlan,
    VendorStatusEnum,
)

__all__ = [
    "BudgetHealthEnum",
    "BudgetPlan",
    "CategoryAllocation",
    "CityTierEnum",
    "ErrorDetail",
    "ErrorResponse",
    "FunctionActivity",
    "IdeasPlan",
    "IdeasRequest",
    "OverviewData",
    "PlanRequest",
    "PlanResponse",
    "PriorityEnum",
    "RecalculateRequest",
    "RecalculateResponse",
    "StrictBaseModel",
    "TaskPriorityEnum",
    "TimelinePlan",
    "TimelineTask",
    "VendorCategoryItem",
    "VendorPlan",
    "VendorStatusEnum",
    "WeddingFunctionEnum",
    "WeddingStyleEnum",
]
