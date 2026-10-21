"""In-memory sliding window rate limiter per client IP."""
from __future__ import annotations

import collections
import threading
import time

from starlette.requests import Request
from starlette.responses import JSONResponse


class SlidingWindowRateLimiter:
    """Sliding-window rate limiter tracking timestamps per IP address."""

    def __init__(self, requests_per_minute: int = 30) -> None:
        self.rpm = requests_per_minute
        self.window = 60.0  # seconds
        self._history: dict[str, collections.deque[float]] = collections.defaultdict(
            collections.deque
        )
        self._lock = threading.Lock()

    def is_allowed(self, client_ip: str) -> tuple[bool, int]:
        """Check if request is allowed. Returns (is_allowed, retry_after_seconds)."""
        now = time.time()
        window_start = now - self.window

        with self._lock:
            queue = self._history[client_ip]

            # Pop timestamps older than the 60-second window
            while queue and queue[0] < window_start:
                queue.popleft()

            if len(queue) >= self.rpm:
                # Exceeded rate limit
                oldest = queue[0]
                retry_after = max(1, int(oldest + self.window - now))
                return False, retry_after

            queue.append(now)
            return True, 0


def get_client_ip(request: Request) -> str:
    """Extract client IP safely from headers or connection."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the leftmost IP in X-Forwarded-For
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


class RateLimitMiddleware:
    """Convenience helper for checking rate limits in route dependencies or middleware."""

    def __init__(self, limiters: dict[str, SlidingWindowRateLimiter]) -> None:
        self.limiters = limiters

    def check(self, request: Request, bucket_name: str) -> JSONResponse | None:
        limiter = self.limiters.get(bucket_name)
        if not limiter:
            return None

        client_ip = get_client_ip(request)
        allowed, retry_after = limiter.is_allowed(client_ip)
        if not allowed:
            return JSONResponse(
                status_code=429,
                headers={"Retry-After": str(retry_after)},
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded for this endpoint. Please retry after {retry_after} seconds.",
                    }
                },
            )
        return None
