"""Gemini client abstraction with Protocol and testable fake implementation."""

from __future__ import annotations

import logging
from typing import Any, Protocol, runtime_checkable

from pydantic import BaseModel

logger = logging.getLogger("wedplan.ai")


@runtime_checkable
class GeminiClientProtocol(Protocol):
    """Protocol defining the interface for Gemini generative AI clients."""

    async def generate_json(
        self,
        model: str,
        contents: str,
        response_schema: type[BaseModel],
    ) -> BaseModel:
        """Generate structured JSON conforming to the given Pydantic schema."""
        ...


class RealGeminiClient:
    """Production implementation using the Google GenAI SDK."""

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def generate_json(
        self,
        model: str,
        contents: str,
        response_schema: type[BaseModel],
    ) -> BaseModel:
        from google.genai import types

        client = self._get_client()
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                max_output_tokens=3000,
                temperature=0.7,
            ),
        )

        raw_text = response.text
        if not raw_text:
            raise ValueError("Empty response received from Gemini API.")

        return response_schema.model_validate_json(raw_text)


class FakeGeminiClient:
    """Mock implementation for unit tests and local deterministic execution."""

    def __init__(self, canned_response: BaseModel | None = None, should_fail: bool = False) -> None:
        self.canned_response = canned_response
        self.should_fail = should_fail
        self.call_count = 0

    async def generate_json(
        self,
        model: str,
        contents: str,
        response_schema: type[BaseModel],
    ) -> BaseModel:
        self.call_count += 1
        if self.should_fail:
            raise RuntimeError("Simulated Gemini API failure.")

        if self.canned_response is not None:
            return self.canned_response

        # Default minimal valid response
        return response_schema.model_validate(
            {
                "overview_summary": "Authentic mock celebration plan.",
                "themes_and_decor": ["Traditional Marigold decor with brass diyas."],
                "catering_and_menu": ["Royal regional buffet with seasonal delicacies."],
                "function_activities": [{"function": "Wedding", "activity": "Sacred Pheras around the holy fire."}],
                "guest_experience_ideas": ["Handcrafted welcome hampers in guest rooms."],
                "money_saving_hacks": ["Booking banquet hall and lawn together saves roughly 15%."],
            }
        )
