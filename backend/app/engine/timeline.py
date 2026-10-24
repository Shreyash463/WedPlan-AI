"""Timeline countdown roadmap engine with intelligent short-notice compression."""

from __future__ import annotations

from datetime import date, timedelta

from backend.app.engine.data.timeline_data import (
    CANONICAL_PHASES,
    TASK_TEMPLATES,
    TaskTemplateDef,
)
from backend.app.models import (
    TaskPriorityEnum,
    TimelinePlan,
    TimelineTask,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


def determine_phase_name(days_before: int) -> str:
    """Map day offset to canonical countdown phase names.

    Args:
        days_before: Number of days remaining before wedding date.

    Returns:
        Canonical countdown phase label.
    """
    if days_before < 0:
        return "After Wedding"
    if days_before == 0:
        return "Wedding Day"
    if days_before <= 3:
        return "Final 72 Hours"
    if days_before <= 7:
        return "Final Week"
    if days_before <= 14:
        return "2 Weeks"
    if days_before <= 30:
        return "1 Month"
    if days_before <= 60:
        return "2 Months"
    if days_before <= 120:
        return "3-4 Months"
    if days_before <= 180:
        return "5-6 Months"
    return "6+ Months"


def _resolve_task_wording(
    task_id: str,
    default_title: str,
    default_desc: str,
    budget_band: str,
    is_royal: bool,
    style: WeddingStyleEnum | str,
) -> tuple[str, str]:
    """Resolve context-aware title and description variants based on budget band."""
    if task_id == "task_photo_booking":
        if budget_band == "Tight":
            return (
                "Book Photography & Videography Team",
                "Confirm essential candid and traditional photographers, schedule family portrait shots.",
            )
        if budget_band == "Premium" and is_royal:
            return (
                "Book Cinematic Photo & Drone Filmmaking Crew",
                "Confirm master candid photographers, 4K cinematographers, licensed drone pilots, and pre-wedding shoot dates.",
            )
        return (
            "Book Photography & Cinematography Crew",
            "Confirm candid photographers, traditional videographers, and pre-wedding shoot dates.",
        )

    if task_id == "task_decor_mandap":
        if budget_band == "Tight":
            return (
                "Finalize Mandap, Floral & Lighting Designs",
                "Approve stage layout, seasonal floral colour palette (marigold/jasmine), entrance arch, and pathway fairy lights.",
            )
        if budget_band == "Premium":
            return (
                "Finalize 3D Stage Renders, Floral & Architectural Lighting",
                "Approve 3D stage renders, premium floral installations, entrance arch, and architectural spotlighting.",
            )
        return (
            "Finalize Mandap, Floral & Lighting Designs",
            "Approve stage mood boards, floral colour palette (marigold/roses), entrance arch, and ambient warm fairy lights.",
        )

    if task_id == "task_soundcheck":
        if budget_band == "Tight" or style == WeddingStyleEnum.BUDGET_SMART:
            return (
                "Soundcheck, Generator & Ceremony Audio Rehearsal",
                "Verify on-site generator power backup, mic sound clarity, and wedding ceremony music playlist.",
            )
        if budget_band == "Premium" and is_royal:
            return (
                "Soundcheck, Generator & Cold Pyro Rehearsal",
                "Verify on-site silent DG generator backup, sound clarity, varmala stage hydraulic lift, and cold pyro fire permits.",
            )
        return (
            "Soundcheck, DJ Rehearsal & DG Power Backup",
            "Verify on-site silent DG generator backup, acoustic sound clarity, and stage ceremony timing.",
        )

    return default_title, default_desc


def _build_task_instance(
    tmpl: TaskTemplateDef,
    wedding_date: date,
    today: date,
    budget_band: str,
    is_royal: bool,
    style: WeddingStyleEnum | str,
) -> TimelineTask:
    """Build a single scheduled TimelineTask from template."""
    raw_days_before = tmpl.days_before
    target_date = wedding_date - timedelta(days=raw_days_before)
    is_overdue = target_date < today and raw_days_before >= 0

    if is_overdue:
        priority = TaskPriorityEnum.URGENT
        scheduled_date = min(wedding_date, today)
    else:
        priority = TaskPriorityEnum(tmpl.base_priority)
        scheduled_date = max(target_date, today)

    effective_days = (wedding_date - scheduled_date).days
    phase = determine_phase_name(effective_days)
    title, desc = _resolve_task_wording(tmpl.id, tmpl.title, tmpl.description, budget_band, is_royal, style)

    return TimelineTask(
        id=tmpl.id,
        title=title,
        phase=phase,
        due_date=scheduled_date.isoformat(),
        priority=priority,
        related_vendor_category=tmpl.vendor,
        description=desc,
        is_overdue_standard=is_overdue,
    )


def generate_timeline_plan(
    wedding_date: date,
    functions: list[WeddingFunctionEnum],
    style: WeddingStyleEnum,
    current_date: date | None = None,
    budget_band: str = "Comfortable",
) -> TimelinePlan:
    """Generate dynamic timeline tasks with chronological ordering and overdue tracking.

    Args:
        wedding_date: Target date of wedding ceremony.
        functions: List of selected wedding ceremonies.
        style: Theme or vibe of celebration.
        current_date: Mockable current date for deterministic testing.
        budget_band: Budget tier ("Tight", "Comfortable", "Premium").

    Returns:
        Structured TimelinePlan with phases and tasks.
    """
    today = current_date or date.today()
    days_remaining = (wedding_date - today).days
    is_tight = days_remaining <= 14

    selected_func_names = {f.value if hasattr(f, "value") else str(f) for f in functions}
    is_royal = style in (WeddingStyleEnum.ROYAL_PALACE, WeddingStyleEnum.DESTINATION, "Royal/Palace", "Destination")

    tasks: list[TimelineTask] = []
    for tmpl in TASK_TEMPLATES:
        if tmpl.function is not None and tmpl.function not in selected_func_names:
            continue
        tasks.append(_build_task_instance(tmpl, wedding_date, today, budget_band, is_royal, style))

    priority_weight = {TaskPriorityEnum.URGENT: 0, TaskPriorityEnum.HIGH: 1, TaskPriorityEnum.NORMAL: 2}
    tasks.sort(key=lambda t: (t.due_date, priority_weight.get(t.priority, 2), t.id))

    present_phases = {t.phase for t in tasks}
    phases_in_order = [p for p in CANONICAL_PHASES if p in present_phases]

    return TimelinePlan(
        days_remaining=days_remaining,
        is_tight_timeline=is_tight,
        phases=phases_in_order,
        tasks=tasks,
    )
