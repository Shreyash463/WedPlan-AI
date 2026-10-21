"""Vercel Python serverless function entrypoint.

Exposes the FastAPI application from backend.app.main.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure root and backend directory are in Python path for Vercel serverless execution
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.main import app  # noqa: E402

# Export app as handler for Vercel WSGI/ASGI runtime
handler = app
