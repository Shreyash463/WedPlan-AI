"""Vercel Python serverless function entrypoint.

Exposes the FastAPI application from backend.app.main with diagnostic fallback.
"""
from __future__ import annotations

import os
import sys
import traceback
from pathlib import Path

# Add project root, api directory, and current working directory to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent

for candidate in [str(REPO_ROOT), str(CURRENT_DIR), os.getcwd()]:
    if candidate and candidate not in sys.path:
        sys.path.insert(0, candidate)

from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Top-level module variable for Vercel static AST detection
app: FastAPI = FastAPI(title="WedPlan AI API")

try:
    from backend.app.main import app as backend_app
    app = backend_app
    handler = app
except Exception as exc:
    # Print full traceback to stderr so it is visible in Vercel runtime logs
    traceback.print_exc(file=sys.stderr)

    err_class = type(exc).__name__
    err_msg = str(exc)
    diagnostic_summary = f"{err_class}: {err_msg}"

    @app.get("/api/health")
    async def diagnostic_health():
        return JSONResponse(
            status_code=200,
            content={
                "status": "error",
                "stage": "import",
                "error": diagnostic_summary,
            },
        )

    @app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def diagnostic_catchall(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "IMPORT_ERROR",
                    "stage": "import",
                    "message": diagnostic_summary,
                }
            },
        )

    handler = app
