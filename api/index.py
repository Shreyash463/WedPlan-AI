"""Vercel Python serverless function entrypoint.

Exposes the FastAPI application from backend.app.main with diagnostic fallback.
"""

from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path
from typing import Any

# Add project root, api directory, and current working directory to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent

for candidate in [str(REPO_ROOT), str(CURRENT_DIR), str(Path.cwd())]:
    if candidate and candidate not in sys.path:
        sys.path.insert(0, candidate)

# Top-level variables for Vercel static AST detection and runtime export
app: Any = None
handler: Any = None

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

    try:
        from fastapi import FastAPI
        from fastapi.responses import JSONResponse

        diag_app: FastAPI = FastAPI(title="WedPlan AI Fallback Diagnostics")

        @diag_app.get("/api/health")
        async def diagnostic_health() -> JSONResponse:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "error",
                    "stage": "import",
                    "error": diagnostic_summary,
                },
            )

        @diag_app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
        async def diagnostic_catchall(path: str) -> JSONResponse:
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

        app = diag_app
        handler = app

    except Exception:
        # Ultimate standard library ASGI fallback if fastapi itself fails to import
        async def fallback_asgi(scope: dict[str, Any], receive: Any, send: Any) -> None:
            if scope["type"] == "http":
                body = json.dumps(
                    {
                        "status": "error",
                        "stage": "import",
                        "error": diagnostic_summary,
                    }
                ).encode("utf-8")
                await send(
                    {
                        "type": "http.response.start",
                        "status": 200,
                        "headers": [
                            [b"content-type", b"application/json"],
                            [b"content-length", str(len(body)).encode("utf-8")],
                        ],
                    }
                )
                await send({"type": "http.response.body", "body": body})

        app = fallback_asgi
        handler = app
