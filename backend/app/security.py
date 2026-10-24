"""Security utilities, input sanitation, and response headers."""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Awaitable, Callable
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def sanitize_input_text(raw: str | None, max_length: int = 300) -> str:
    """Sanitize freeform user input.

    Strips ANSI escape codes, control characters, normalizes whitespace, and truncates.
    Guards against hidden prompt injection payloads and malformed characters.
    """
    if not raw:
        return ""
    # Strip ANSI escape sequences (e.g. \x1b[31m)
    cleaned = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", " ", raw)
    # Strip non-printable ASCII / control characters (except space)
    cleaned = re.sub(r"[\x00-\x1f\x7f-\x9f]", " ", cleaned)
    # Collapse multiple whitespaces
    cleaned = " ".join(cleaned.split())
    # Enforce strict length cap
    return cleaned[:max_length]


def compute_plan_hash(data: dict[str, Any]) -> str:
    """Generate deterministic SHA-256 hash from normalized input parameters."""
    normalized_json = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(normalized_json.encode("utf-8")).hexdigest()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforce strict security headers across all HTTP responses."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        response: Response = await call_next(request)

        # Content-Security-Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        return response
