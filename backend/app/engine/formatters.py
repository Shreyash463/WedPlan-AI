"""Shared formatting utilities for Indian Currency (INR), cities, and numbers."""
from __future__ import annotations


def format_inr(amount: int | float, include_symbol: bool = True) -> str:
    """Format an integer amount in the Indian numbering system (e.g. 25,00,000).

    Uses the 3-2-2 grouping pattern (lakhs and crores).
    """
    int_amt = int(round(amount))
    is_negative = int_amt < 0
    s = str(abs(int_amt))

    if len(s) <= 3:
        formatted = s
    else:
        # Last 3 digits
        last_three = s[-3:]
        remaining = s[:-3]
        # Group remaining digits in pairs from right to left
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        formatted = ",".join(groups) + "," + last_three

    prefix = "-" if is_negative else ""
    symbol = "₹" if include_symbol else ""
    return f"{prefix}{symbol}{formatted}"


def format_inr_compact(amount: int | float) -> str:
    """Format currency in compact Indian notation (e.g. ₹50 K, ₹25 L, ₹1.5 Cr)."""
    amt = abs(int(round(amount)))
    symbol = "₹"

    if amt >= 10_000_000:
        val = amt / 10_000_000
        formatted = f"{val:.2f}".rstrip("0").rstrip(".")
        return f"{symbol}{formatted} Cr"
    if amt >= 100_000:
        val = amt / 100_000
        formatted = f"{val:.2f}".rstrip("0").rstrip(".")
        return f"{symbol}{formatted} L"
    if amt >= 1_000:
        val = amt / 1_000
        formatted = f"{val:.1f}".rstrip("0").rstrip(".")
        return f"{symbol}{formatted} K"
    return f"{symbol}{amt}"


def title_case_city(city: str) -> str:
    """Capitalize city names cleanly to Title Case.

    Handles:
    - Multiple and leading/trailing spaces (e.g. '   navi   mumbai   ' -> 'Navi Mumbai')
    - All-caps inputs (e.g. 'NAGPUR' -> 'Nagpur', 'PUNE' -> 'Pune')
    - Hyphenated compound names (e.g. 'hubli-dharwad' -> 'Hubli-Dharwad')
    """
    if not city:
        return ""
    words = city.strip().split()
    formatted_words = []
    for word in words:
        # Split by hyphen if any
        subparts = word.split("-")
        formatted_subparts = [
            sub.capitalize() for sub in subparts
        ]
        formatted_words.append("-".join(formatted_subparts))
    return " ".join(formatted_words)
