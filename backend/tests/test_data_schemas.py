"""Tests validating the integrity and schemas of static domain data catalogs."""

from __future__ import annotations

from backend.app.engine.data.ideas_data import (
    FORBIDDEN_PREMIUM_TERMS,
    RECOGNIZED_SPECIAL_THEME_RULES,
    get_base_idea_pool,
)
from backend.app.engine.data.timeline_data import (
    TASK_TEMPLATES,
)
from backend.app.engine.data.vendors_data import (
    MASTER_VENDOR_PROFILES,
)


def test_timeline_task_templates_integrity():
    """Verify all task templates have unique IDs, valid priorities, and non-empty descriptions."""
    seen_ids = set()
    for tmpl in TASK_TEMPLATES:
        assert tmpl.id not in seen_ids, f"Duplicate task ID: {tmpl.id}"
        seen_ids.add(tmpl.id)

        assert tmpl.id.startswith("task_"), f"Task ID {tmpl.id} must start with 'task_'"
        assert tmpl.title.strip(), f"Task {tmpl.id} title cannot be empty"
        assert tmpl.description.strip(), f"Task {tmpl.id} description cannot be empty"
        assert tmpl.base_priority in ("Urgent", "High", "Normal")


def test_vendor_profiles_integrity():
    """Verify all vendor profiles have unique IDs, valid lead times, and required contract clauses."""
    seen_ids = set()
    for profile in MASTER_VENDOR_PROFILES:
        assert profile.id not in seen_ids, f"Duplicate vendor ID: {profile.id}"
        seen_ids.add(profile.id)

        assert profile.id.startswith("vendor_"), f"Vendor ID {profile.id} must start with 'vendor_'"
        assert profile.lead_time_weeks > 0, f"Lead time must be positive for {profile.id}"
        assert len(profile.questions_to_ask) >= 3, f"At least 3 questions required for {profile.id}"
        assert len(profile.contract_must_haves) >= 3, f"At least 3 contract clauses required for {profile.id}"


def test_ideas_catalog_integrity():
    """Verify ideas catalog contains valid budget tiers, categories, and tags."""
    pool = get_base_idea_pool("Jaipur")
    assert len(pool) >= 25, "Expected comprehensive idea pool"

    for item in pool:
        assert item.budget_tier in ("frugal", "standard", "premium")
        assert item.category in ("theme", "catering", "guest_exp", "money_hack")
        assert len(item.text.strip()) > 10, "Idea text too short"

    assert len(FORBIDDEN_PREMIUM_TERMS) >= 10
    assert len(RECOGNIZED_SPECIAL_THEME_RULES) >= 10
