"""FastAPI application factory and middleware configuration for WedPlan AI."""
from __future__ import annotations

import logging
import sys
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.config import settings
from backend.app.routes.plan import router as plan_router
from backend.app.security import SecurityHeadersMiddleware

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("wedplan.app")

MAX_CONTENT_LENGTH = 1_048_576  # 1 MB maximum request body size


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject payloads exceeding MAX_CONTENT_LENGTH to guard against memory exhaustion."""

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_CONTENT_LENGTH:
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "error": {
                                "code": "PAYLOAD_TOO_LARGE",
                                "message": "Request body exceeds maximum allowed size (1 MB).",
                            }
                        },
                    )
            except ValueError:
                pass
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("WedPlan AI backend initialized. Environment: %s", settings.environment)
    yield
    logger.info("WedPlan AI backend shutting down.")


app = FastAPI(
    title="WedPlan AI API",
    description="Intelligent Indian Wedding Planning Assistant with GenAI-powered customization.",
    version="1.0.0",
    docs_url="/api/docs" if settings.environment == "development" else None,
    redoc_url="/api/redoc" if settings.environment == "development" else None,
    openapi_url="/api/openapi.json" if settings.environment == "development" else None,
    lifespan=lifespan,
)

# 1. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. GZip Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. Request Size Limiter
app.add_middleware(RequestSizeLimitMiddleware)

# 4. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],
)

# 5. Include API Routers
app.include_router(plan_router)


# 6. Consistent Error Handling
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format Pydantic schema validation errors with clean message and details."""
    formatted_errors = []
    for err in exc.errors():
        field_path = ".".join(str(loc) for loc in err.get("loc", []))
        formatted_errors.append(
            {
                "field": field_path,
                "message": err.get("msg", "Invalid value"),
                "type": err.get("type", "value_error"),
            }
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "One or more input fields failed validation.",
                "details": formatted_errors,
            }
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensure HTTP exceptions follow standardized error envelope."""
    headers = getattr(exc, "headers", None) or {}
    code_map = {
        400: "BAD_REQUEST",
        404: "NOT_FOUND",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
    }
    code = code_map.get(exc.status_code, "ERROR")

    return JSONResponse(
        status_code=exc.status_code,
        headers=headers,
        content={
            "error": {
                "code": code,
                "message": str(exc.detail),
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Global catch-all preventing any stack trace or internals from leaking while logging traceback to stderr."""
    traceback.print_exc(file=sys.stderr)
    logger.critical("Unhandled server exception: %s", type(exc).__name__, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            }
        },
    )
