"""Unit tests for the timeline roadmap and compression engine."""

from __future__ import annotations

from datetime import date, timedelta

from backend.app.engine.timeline import generate_timeline_plan
from backend.app.models import (
    TaskPriorityEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)


def test_standard_timeline_lead_time():
    """Verify standard countdown offsets when wedding date is far in future (e.g. 10 months)."""
    today = date(2026, 1, 1)
    wedding_date = today + timedelta(days=300)

    plan = generate_timeline_plan(
        wedding_date=wedding_date,
        functions=[
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
        ],
        style=WeddingStyleEnum.TRADITIONAL,
        current_date=today,
    )

    assert plan.days_remaining == 300
    assert not plan.is_tight_timeline
    assert len(plan.tasks) > 10

    # Ensure no dates are in the past
    for task in plan.tasks:
        task_date = date.fromisoformat(task.due_date)
        assert task_date >= today, f"Task {task.id} has date {task.due_date} prior to today {today}"


def test_short_notice_compression():
    """Verify that a short-notice wedding (e.g. 25 days away) compresses phases and flags overdue tasks as Urgent."""
    today = date(2026, 1, 1)
    wedding_date = today + timedelta(days=25)

    plan = generate_timeline_plan(
        wedding_date=wedding_date,
        functions=[WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.BUDGET_SMART,
        current_date=today,
    )

    assert plan.days_remaining == 25
    # Since standard lead time for venue/caterer is 150-210 days, those tasks must be marked Urgent
    urgent_tasks = [t for t in plan.tasks if t.priority == TaskPriorityEnum.URGENT]
    assert len(urgent_tasks) > 0, "No urgent tasks generated for 25-day compressed timeline"

    # Urgent tasks must be sorted to the front of the list
    first_task = plan.tasks[0]
    assert first_task.priority == TaskPriorityEnum.URGENT

    # Every task date must be on or after today and on or before wedding_date (or post-wedding wrap-up)
    for task in plan.tasks:
        task_date = date.fromisoformat(task.due_date)
        assert task_date >= today


def test_very_tight_timeline_flag():
    """Verify that weddings within 14 days trigger the is_tight_timeline flag."""
    today = date(2026, 1, 1)
    wedding_date = today + timedelta(days=10)

    plan = generate_timeline_plan(
        wedding_date=wedding_date,
        functions=[WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.TRADITIONAL,
        current_date=today,
    )

    assert plan.days_remaining == 10
    assert plan.is_tight_timeline is True


def test_function_specific_tasks():
    """Verify function selection filters tasks accurately (e.g. Mehendi & Sangeet)."""
    today = date(2026, 1, 1)
    wedding_date = today + timedelta(days=180)

    # Without Mehendi or Sangeet
    plan_simple = generate_timeline_plan(
        wedding_date=wedding_date,
        functions=[WeddingFunctionEnum.WEDDING],
        style=WeddingStyleEnum.TRADITIONAL,
        current_date=today,
    )
    task_ids_simple = [t.id for t in plan_simple.tasks]
    assert "task_mehendi_artist" not in task_ids_simple
    assert "task_sangeet_choreographer" not in task_ids_simple

    # With Mehendi and Sangeet
    plan_full = generate_timeline_plan(
        wedding_date=wedding_date,
        functions=[
            WeddingFunctionEnum.MEHENDI,
            WeddingFunctionEnum.SANGEET,
            WeddingFunctionEnum.WEDDING,
        ],
        style=WeddingStyleEnum.TRADITIONAL,
        current_date=today,
    )
    task_ids_full = [t.id for t in plan_full.tasks]
    assert "task_mehendi_artist" in task_ids_full
    assert "task_sangeet_choreographer" in task_ids_full


def test_due_dates_strictly_non_decreasing():
    """Verify that tasks across the final ordered list have non-decreasing due dates for multiple horizons."""
    from backend.app.engine.timeline import CANONICAL_PHASES

    today = date(2026, 4, 1)
    horizons = [300, 90, 30, 10]

    for days in horizons:
        wedding_date = today + timedelta(days=days)
        plan = generate_timeline_plan(
            wedding_date=wedding_date,
            functions=[
                WeddingFunctionEnum.HALDI,
                WeddingFunctionEnum.MEHENDI,
                WeddingFunctionEnum.SANGEET,
                WeddingFunctionEnum.WEDDING,
                WeddingFunctionEnum.RECEPTION,
            ],
            style=WeddingStyleEnum.TRADITIONAL,
            current_date=today,
        )

        # 1. Assert due_dates are non-decreasing
        due_dates = [t.due_date for t in plan.tasks]
        for i in range(len(due_dates) - 1):
            assert due_dates[i] <= due_dates[i + 1], (
                f"Horizon {days}d: due date {due_dates[i]} at index {i} "
                f"is greater than {due_dates[i + 1]} at index {i + 1}"
            )

        # 2. Assert phase headers appear in canonical order
        for i in range(len(plan.phases) - 1):
            curr_idx = CANONICAL_PHASES.index(plan.phases[i])
            next_idx = CANONICAL_PHASES.index(plan.phases[i + 1])
            assert curr_idx < next_idx, (
                f"Horizon {days}d: phase {plan.phases[i]} appears before {plan.phases[i + 1]} violating canonical order"
            )

        # 3. For short-notice (10 days), venue booking must be marked as overdue standard
        if days == 10:
            venue_task = next(t for t in plan.tasks if t.id == "task_venue_booking")
            assert venue_task.is_overdue_standard is True
            assert venue_task.priority == TaskPriorityEnum.URGENT
