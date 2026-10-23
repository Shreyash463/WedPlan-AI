"""Vercel Serverless Function Local Simulation Script.

Simulates how the Vercel Python runtime loads and executes api/index.py:
1. Dynamically loads `api/index.py` using `importlib.util.spec_from_file_location`.
2. Verifies that the ASGI `app` object is exported.
3. Tests key endpoints: GET /api/health, POST /api/plan, POST /api/recalculate.
"""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path


def simulate_vercel_loader():
    repo_root = Path(__file__).resolve().parent.parent
    os.chdir(repo_root)

    print(f"[1/4] Simulating Vercel environment from root: {repo_root}")

    # Ensure api/index.py exists
    entrypoint = repo_root / "api" / "index.py"
    if not entrypoint.exists():
        raise FileNotFoundError(f"Entrypoint {entrypoint} does not exist.")

    # Remove repo_root from sys.path if present, to test api/index.py self-bootstrap
    if str(repo_root) in sys.path:
        sys.path.remove(str(repo_root))

    # Load module exactly like Vercel's resolver.py
    spec = importlib.util.spec_from_file_location("vc_entrypoint", str(entrypoint))
    if spec is None or spec.loader is None:
        raise ImportError("Failed to create spec for api/index.py")

    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    print("[2/4] Successfully imported api/index.py via dynamic loader.")

    # Check for ASGI callable 'app'
    if not hasattr(mod, "app"):
        raise AttributeError("Module api/index.py does not expose 'app' callable.")

    app = getattr(mod, "app")
    print(f"[3/4] Found exported ASGI app: {type(app).__name__}")

    # Test routes using Starlette TestClient
    from starlette.testclient import TestClient

    client = TestClient(app)

    # 1. Health check
    res_health = client.get("/api/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.status_code} {res_health.text}"
    health_data = res_health.json()
    assert health_data.get("status") in ("ok", "healthy"), f"Unexpected health status: {health_data}"
    print("  [OK] GET /api/health returned 200 OK (status ok)")

    # 2. Plan generation
    plan_payload = {
        "couple_name": "Priya & Rohan",
        "wedding_date": "2026-12-15",
        "city": "Jaipur",
        "city_tier": "Tier-2",
        "total_budget": 3000000,
        "guest_count": 300,
        "functions": ["Wedding", "Haldi", "Sangeet"],
        "style": "Royal/Palace",
        "priorities": ["Food", "Venue & Decor"],
        "special_requests": "Pure vegetarian with sunset mandap",
    }
    res_plan = client.post("/api/plan", json=plan_payload)
    assert res_plan.status_code == 200, f"Plan generation failed: {res_plan.status_code} {res_plan.text}"
    plan_data = res_plan.json()
    assert "budget" in plan_data, "Missing budget in plan output"
    assert "timeline" in plan_data, "Missing timeline in plan output"
    assert "vendors" in plan_data, "Missing vendors in plan output"
    assert "ideas" in plan_data, "Missing ideas in plan output"
    assert "overview" in plan_data, "Missing overview in plan output"
    print("  [OK] POST /api/plan returned 200 OK (budget, timeline, vendors, ideas, overview present)")

    # 3. Recalculation
    recalc_payload = {
        "wedding_date": "2026-12-15",
        "city": "Jaipur",
        "city_tier": "Tier-2",
        "total_budget": 3500000,
        "guest_count": 350,
        "functions": ["Wedding", "Haldi", "Sangeet"],
        "style": "Royal/Palace",
        "priorities": ["Food", "Venue & Decor"],
    }
    res_recalc = client.post("/api/recalculate", json=recalc_payload)
    assert res_recalc.status_code == 200, f"Recalculate failed: {res_recalc.status_code} {res_recalc.text}"
    print("  [OK] POST /api/recalculate returned 200 OK")

    print("[4/4] VERCEL SIMULATION PASSED: All serverless entrypoint checks succeeded.")


if __name__ == "__main__":
    try:
        simulate_vercel_loader()
    except Exception as exc:
        print(f"VERCEL SIMULATION FAILED: {exc}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)
