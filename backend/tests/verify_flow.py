"""End-to-end integration verification script."""

from __future__ import annotations

import contextlib
import sys
from pathlib import Path

# Enable UTF-8 console output on Windows
if sys.stdout.encoding != "utf-8":
    with contextlib.suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8")

# Ensure root dir in path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from datetime import date, timedelta  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

from backend.app.main import app  # noqa: E402

client = TestClient(app)


def main():
    print("--- TESTING FULL END-TO-END FLOW ---")

    # 1. Health check
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("[OK] Health check ok")

    # 2. Intake Form -> Get Plan
    future_date = (date.today() + timedelta(days=150)).isoformat()
    form_payload = {
        "couple_name": "Ananya & Kabir",
        "wedding_date": future_date,
        "city": "Udaipur",
        "city_tier": "Tier-2",
        "total_budget": 5000000,
        "guest_count": 400,
        "functions": ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"],
        "style": "Royal/Palace",
        "priorities": ["Food", "Venue & Decor", "Photography"],
        "special_requests": "Sunset lakefront Varmala, organic floral decor, vegetarian Rajasthani thali",
    }
    r_plan = client.post("/api/plan", json=form_payload)
    assert r_plan.status_code == 200, f"Plan failed: {r_plan.text}"
    plan = r_plan.json()
    print("[OK] /api/plan returned 200")
    print("  Overview:", plan["overview"]["summary"])
    print("  Health:", plan["overview"]["health_status"])
    print(f"  Cost per guest: Rs {plan['overview']['cost_per_guest']:,}")
    print(f"  Days remaining: {plan['overview']['days_remaining']}")

    # 3. Check All 5 Tabs Data
    assert len(plan["budget"]["allocations"]) == 10, "Missing budget allocations"
    assert sum(a["amount"] for a in plan["budget"]["allocations"]) == 5000000, "Budget sum mismatch!"
    print("[OK] Tab 1 (Overview) & Tab 2 (Budget) valid. Allocations sum exactly to Rs 50,00,000")

    tasks_count = len(plan["timeline"]["tasks"])
    phases_count = len(plan["timeline"]["phases"])
    assert tasks_count >= 10, "Missing timeline tasks"
    print(f"[OK] Tab 3 (Timeline) valid. {tasks_count} tasks across {phases_count} phases")

    vendors_count = len(plan["vendors"]["categories"])
    assert vendors_count >= 5, "Missing vendor categories"
    print(f"[OK] Tab 4 (Vendors) valid. {vendors_count} vendor categories linked with budgets")

    assert len(plan["ideas"]["themes_and_decor"]) >= 3, "Missing themes"
    assert len(plan["ideas"]["catering_and_menu"]) >= 3, "Missing catering"
    assert len(plan["ideas"]["function_activities"]) >= 3, "Missing activities"
    print(f"[OK] Tab 5 (Ideas) valid. Source: {plan['ideas']['ideas_source']}")

    # 4. What-If Budget Change
    recalc_payload = {
        "wedding_date": future_date,
        "city": "Udaipur",
        "city_tier": "Tier-2",
        "total_budget": 3500000,
        "guest_count": 300,
        "functions": ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"],
        "style": "Royal/Palace",
        "priorities": ["Food", "Venue & Decor"],
    }
    r_recalc = client.post("/api/recalculate", json=recalc_payload)
    assert r_recalc.status_code == 200, f"Recalculate failed: {r_recalc.text}"
    recalc = r_recalc.json()
    assert recalc["budget"]["total_budget"] == 3500000, "Recalculated total budget mismatch"
    assert sum(a["amount"] for a in recalc["budget"]["allocations"]) == 3500000, "Recalculated allocations mismatch"
    print("[OK] What-if recalculation valid! Budget Rs 35,00,000 allocated with exact rupee precision.")

    # 5. Short Notice Timeline Compression
    tight_date = (date.today() + timedelta(days=12)).isoformat()
    tight_payload = dict(form_payload, wedding_date=tight_date)
    r_tight = client.post("/api/plan", json=tight_payload)
    assert r_tight.status_code == 200
    tight_plan = r_tight.json()
    assert tight_plan["timeline"]["is_tight_timeline"] is True, "is_tight_timeline not flagged"
    assert tight_plan["timeline"]["tasks"][0]["priority"] == "Urgent", "Overdue tasks not prioritized"
    print("[OK] Tight timeline compression (<=14 days) valid! Urgent tasks prioritized first.")

    print("\n=======================================================")
    print("ALL END-TO-END FLOW CHECKS PASSED WITH 100% SUCCESS!")
    print("=======================================================")


if __name__ == "__main__":
    main()
