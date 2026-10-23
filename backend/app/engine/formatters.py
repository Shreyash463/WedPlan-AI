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
        formatted_subparts = [sub.capitalize() for sub in subparts]
        formatted_words.append("-".join(formatted_subparts))
    return " ".join(formatted_words)


LOWERCASE_NAME_CONNECTORS = {"and", "weds", "with"}
KNOWN_ACRONYMS = {"dj", "mc", "nri", "usa", "uk", "uae"}


def normalize_currency_in_text(text: str) -> str:
    """Normalize currency mentions to standard Indian rupee format with 3-2-2 grouping.

    Examples:
    - 'INR 50,000' -> '₹50,000'
    - 'INR 50000' -> '₹50,000'
    - 'Rs. 50000' -> '₹50,000'
    - 'Rs 50,000' -> '₹50,000'
    - '₹ 50000' -> '₹50,000'
    """
    import re

    if not text:
        return ""

    pattern = re.compile(r"(?i)\b(?:INR|Rs\.?)\s*([0-9][0-9,]*)|₹\s*([0-9][0-9,]*)")

    def _replace(m: re.Match) -> str:
        raw_num = (m.group(1) or m.group(2) or "").replace(",", "")
        if not raw_num:
            return m.group(0)
        try:
            val = int(raw_num)
            return format_inr(val, include_symbol=True)
        except ValueError:
            return m.group(0)

    return pattern.sub(_replace, text)


def _format_name_token(token: str) -> str:
    """Format an individual name token handling hyphens, apostrophes, and acronyms."""
    if not token:
        return ""

    # Preserve ampersand as-is
    if token == "&":
        return "&"

    # Handle hyphenated parts (e.g. Mary-Jane, Kapoor-Singh)
    if "-" in token:
        return "-".join(_format_name_token(part) for part in token.split("-"))

    # Handle apostrophes (e.g. O'Connor, Chetan's)
    if "'" in token:
        parts = token.split("'")
        if len(parts) == 2 and parts[1].lower() == "s":
            # Possessive: e.g. Chetan's
            return f"{_format_name_token(parts[0])}'s"
        return "'".join(_format_name_token(part) for part in parts)

    # Check for known acronyms or short all-caps tokens
    lower_t = token.lower()
    if lower_t in KNOWN_ACRONYMS or (token.isupper() and 2 <= len(token) <= 4 and token.isalpha()):
        return token.upper()

    return token.capitalize()


def format_couple_name(name: str | None) -> str | None:
    """Normalize couple or event names to Title Case.

    - Collapses extra spaces
    - Keeps small connector words ('and', '&', 'weds', 'with') lowercase (unless at start/end)
    - Preserves acronyms (e.g. 'DJ', 'NRI')
    - Handles apostrophes (e.g. "O'Connor", "Chetan's") and hyphens (e.g. "Mary-Jane")
    """
    if not name:
        return None
    cleaned = " ".join(name.strip().split())
    if not cleaned:
        return None

    words = cleaned.split(" ")
    total_words = len(words)
    formatted_words: list[str] = []

    for i, word in enumerate(words):
        lower_word = word.lower()
        # Keep connector words lowercase if they are not the first or last word
        if lower_word in LOWERCASE_NAME_CONNECTORS and 0 < i < total_words - 1:
            formatted_words.append(lower_word)
        elif word == "&":
            formatted_words.append("&")
        else:
            formatted_words.append(_format_name_token(word))

    return " ".join(formatted_words)
