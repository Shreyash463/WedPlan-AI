"""Vendor checklist and contracts engine linked with budget allocations."""

from __future__ import annotations

from backend.app.engine.data.vendors_data import (
    MASTER_VENDOR_PROFILES,
    VendorProfileDef,
)
from backend.app.models import (
    BudgetPlan,
    VendorCategoryItem,
    VendorPlan,
    VendorStatusEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


def _filter_questions_for_band(
    questions: tuple[str, ...],
    vendor_id: str,
    budget_band: str,
) -> list[str]:
    """Filter out questions referencing premium services for tight budget bands."""
    filtered: list[str] = []
    for q in questions:
        if vendor_id == "vendor_photo" and budget_band == "Tight" and "drone operators" in q:
            filtered.append(q.replace("and drone operators ", ""))
        else:
            filtered.append(q)
    return filtered


def _filter_contracts_for_band(
    contracts: tuple[str, ...],
    vendor_id: str,
    budget_band: str,
) -> list[str]:
    """Filter or adjust contract clauses for tight budget bands."""
    filtered: list[str] = []
    for c in contracts:
        if vendor_id == "vendor_decor" and budget_band == "Tight" and "3D renderings" in c:
            filtered.append("Approved stage moodboard sketches attached as an annexure to the agreement.")
        else:
            filtered.append(c)
    return filtered


def _build_vendor_item(
    profile: VendorProfileDef,
    budget_lookup: dict[str, int],
    budget_band: str,
) -> VendorCategoryItem:
    """Build a single VendorCategoryItem from profile and allocated budget."""
    allocated = budget_lookup.get(profile.budget_key, 0)
    questions = _filter_questions_for_band(profile.questions_to_ask, profile.id, budget_band)
    contracts = _filter_contracts_for_band(profile.contract_must_haves, profile.id, budget_band)

    return VendorCategoryItem(
        id=profile.id,
        name=profile.name,
        allocated_budget=allocated,
        lead_time_weeks=profile.lead_time_weeks,
        advance_payment_guidance=profile.advance_guidance,
        questions_to_ask=questions,
        contract_must_haves=contracts,
        default_status=VendorStatusEnum.NOT_STARTED,
    )


def generate_vendor_plan(
    budget_plan: BudgetPlan,
    functions: list[WeddingFunctionEnum],
    style: WeddingStyleEnum | str = WeddingStyleEnum.TRADITIONAL,
    budget_band: str = "Comfortable",
) -> VendorPlan:
    """Generate vendor categories with contract clauses linked to category budgets.

    Args:
        budget_plan: Computed budget plan with category allocations.
        functions: List of selected wedding functions.
        style: Selected celebration vibe.
        budget_band: Evaluated budget tier ("Tight", "Comfortable", "Premium").

    Returns:
        VendorPlan containing filtered and personalized vendor categories.
    """
    selected_func_names = {f.value if hasattr(f, "value") else str(f) for f in functions}
    budget_lookup: dict[str, int] = {alloc.category: alloc.amount for alloc in budget_plan.allocations}

    categories: list[VendorCategoryItem] = []
    for profile in MASTER_VENDOR_PROFILES:
        if profile.function_filter is not None and profile.function_filter not in selected_func_names:
            continue
        categories.append(_build_vendor_item(profile, budget_lookup, budget_band))

    return VendorPlan(categories=categories)
