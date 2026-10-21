"""Constants, benchmarks, and default weight distributions for Indian Weddings."""
from __future__ import annotations

# Base percentage allocation for an Indian wedding (Sums to exactly 100.0)
BASE_BUDGET_SPLIT: dict[str, float] = {
    "Venue": 18.0,
    "Catering": 30.0,
    "Decor & Florals": 12.0,
    "Photography & Video": 10.0,
    "Attire & Jewellery": 12.0,
    "Music & Entertainment": 5.0,
    "Invitations & Stationery": 2.0,
    "Makeup & Mehendi": 3.0,
    "Logistics, Transport & Stay": 3.0,
    "Contingency": 5.0,
}

# Category floor constraints (minimum percentages allowed)
CATEGORY_FLOORS: dict[str, float] = {
    "Venue": 10.0,
    "Catering": 18.0,
    "Decor & Florals": 5.0,
    "Photography & Video": 5.0,
    "Attire & Jewellery": 5.0,
    "Music & Entertainment": 2.0,
    "Invitations & Stationery": 1.0,
    "Makeup & Mehendi": 1.5,
    "Logistics, Transport & Stay": 1.5,
    "Contingency": 5.0,  # Never reduce contingency below 5%
}

# Cost per guest benchmarks (in INR) across Indian City Tiers
# Used to determine whether a planned budget is Healthy, Tight, or Unrealistic
CITY_TIER_BENCHMARKS: dict[str, dict[str, int]] = {
    "Metro": {
        "healthy_min": 2500,     # >= 2500 INR/guest is healthy
        "tight_min": 1500,       # 1500-2499 INR/guest is tight
        # < 1500 INR/guest is unrealistic for Metros (Mumbai, Delhi NCR, Bangalore, etc.)
    },
    "Tier-2": {
        "healthy_min": 1800,     # >= 1800 INR/guest is healthy
        "tight_min": 1100,       # 1100-1799 INR/guest is tight
        # < 1100 INR/guest is unrealistic (Jaipur, Pune, Ahmedabad, Lucknow, etc.)
    },
    "Tier-3": {
        "healthy_min": 1200,     # >= 1200 INR/guest is healthy
        "tight_min": 800,        # 800-1199 INR/guest is tight
        # < 800 INR/guest is unrealistic
    },
}

# Style/Vibe percentage delta adjustments
STYLE_WEIGHT_DELTAS: dict[str, dict[str, float]] = {
    "Royal/Palace": {
        "Venue": 5.0,
        "Decor & Florals": 3.0,
        "Logistics, Transport & Stay": 2.0,
        "Invitations & Stationery": -1.0,
    },
    "Traditional": {
        "Attire & Jewellery": 3.0,
        "Venue": 2.0,
        "Catering": 2.0,
        "Music & Entertainment": -1.0,
    },
    "Modern Minimal": {
        "Decor & Florals": -2.0,
        "Invitations & Stationery": -1.0,
        "Photography & Video": 2.0,
        "Catering": 1.0,
    },
    "Destination": {
        "Logistics, Transport & Stay": 7.0,
        "Venue": 3.0,
        "Attire & Jewellery": -3.0,
        "Invitations & Stationery": -1.0,
    },
    "Eco-friendly": {
        "Decor & Florals": 2.0,
        "Invitations & Stationery": -1.0,
        "Catering": 1.0,
        "Attire & Jewellery": -2.0,
    },
    "Budget-smart": {
        "Decor & Florals": -3.0,
        "Attire & Jewellery": -3.0,
        "Invitations & Stationery": -1.0,
        "Contingency": 2.0,
    },
}

# User priority percentage deltas (top 3 selected)
PRIORITY_WEIGHT_DELTAS: dict[str, dict[str, float]] = {
    "Food": {"Catering": 4.0},
    "Venue & Decor": {"Venue": 3.0, "Decor & Florals": 2.0},
    "Photography": {"Photography & Video": 4.0},
    "Music & Entertainment": {"Music & Entertainment": 3.0},
    "Attire & Jewellery": {"Attire & Jewellery": 3.0},
    "Guest Experience": {
        "Logistics, Transport & Stay": 2.0,
        "Catering": 2.0,
        "Music & Entertainment": 1.0,
    },
}

# Supported wedding functions in Indian weddings
VALID_FUNCTIONS: list[str] = [
    "Engagement",
    "Haldi",
    "Mehendi",
    "Sangeet",
    "Wedding",
    "Reception",
]

# Standard disclaimer for event estimates
ESTIMATE_DISCLAIMER: str = (
    "Note: All budget figures and vendor lead times are expert estimations tailored for "
    "Indian weddings. Actual quotes may fluctuate depending on season (Shubh Muhurat dates), "
    "exact venue choice, and vendor negotiations."
)
