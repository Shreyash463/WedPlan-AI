"""Ideas catalog data models and curated static Indian wedding ideas pool."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

FORBIDDEN_PREMIUM_TERMS: tuple[str, ...] = (
    "pyrotechnic",
    "cold pyro",
    "helicopter",
    "imported flower",
    "imported bloom",
    "hydraulic lift",
    "crystal chandelier",
    "vintage rolls royce",
    "champagne",
    "chef-curated live gourmet",
    "chef-curated",
    "masterchef",
    "molecular dessert",
    "drone light show",
    "aerial petal drop",
    "aerial floral",
)

RECOGNIZED_SPECIAL_THEME_RULES: tuple[tuple[tuple[str, ...], str], ...] = (
    (("jain",), "pure Jain"),
    (("pure veg", "vegetarian"), "pure vegetarian"),
    (("vegan",), "vegan catering"),
    (("sunset",), "sunset outdoor"),
    (("outdoor", "lawn", "open air", "garden"), "outdoor lawn"),
    (("eco", "green", "sustainable", "zero waste"), "eco-friendly"),
    (("destination", "beach"), "destination hospitality"),
    (("punjabi", "sikh"), "Punjabi celebrations"),
    (("marathi", "maharashtrian"), "Maharashtrian traditions"),
    (("south indian", "carnatic", "tamil", "telugu", "kannada", "malayali"), "South Indian traditions"),
    (("gujarati", "marwari", "rajasthani"), "Rajasthani heritage"),
    (("bengali",), "Bengali traditions"),
    (("halal",), "Halal dining"),
    (("cocktail", "alcohol", "sangeet bar", "bar"), "curated cocktail bar"),
)


@dataclass(frozen=True, slots=True)
class TaggedIdea:
    """Idea item tagged with vibe, budget tier, category, and matching constraints."""

    text: str
    vibe: str
    budget_tier: Literal["frugal", "standard", "premium"]
    category: Literal["theme", "catering", "guest_exp", "money_hack"]
    priority: str = "All"
    function: str = "All"
    keywords: tuple[str, ...] = field(default_factory=tuple)


# Re-export get_base_idea_pool from dedicated pool module
from backend.app.engine.data.ideas_pool import get_base_idea_pool  # noqa: E402

__all__ = [
    "FORBIDDEN_PREMIUM_TERMS",
    "RECOGNIZED_SPECIAL_THEME_RULES",
    "TaggedIdea",
    "get_base_idea_pool",
]
