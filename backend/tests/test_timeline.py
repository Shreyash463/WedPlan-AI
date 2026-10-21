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
