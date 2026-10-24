"""Domain exception hierarchy for WedPlan AI.

All application-level exceptions derive from `PlanningError`, allowing unified
error handling and consistent HTTP error mapping in FastAPI middleware.
"""

from __future__ import annotations


class PlanningError(Exception):
    """Base domain exception for WedPlan AI."""

    def __init__(self, message: str, code: str = "PLANNING_ERROR", status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class PlanValidationError(PlanningError):
    """Raised when plan input parameters violate domain business constraints."""

    def __init__(self, message: str, code: str = "VALIDATION_ERROR") -> None:
        super().__init__(message=message, code=code, status_code=422)


class PlanCalculationError(PlanningError):
    """Raised when budget allocation or timeline compression invariants fail."""

    def __init__(self, message: str, code: str = "CALCULATION_ERROR") -> None:
        super().__init__(message=message, code=code, status_code=500)


class AIServiceError(PlanningError):
    """Raised when generative AI invocation fails or produces unparseable output."""

    def __init__(self, message: str, code: str = "AI_SERVICE_ERROR") -> None:
        super().__init__(message=message, code=code, status_code=502)
