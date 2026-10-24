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


def get_base_idea_pool(city: str) -> list[TaggedIdea]:
    """Return the master catalog of culturally curated, tagged Indian wedding ideas."""
    return [
        # --- THEMES & DECOR ---
        TaggedIdea(
            text=f"Royal look on a budget in {city}: Rented vintage brass urlis with floating local marigolds and rose petals for an opulent entrance walkway.",
            vibe="Royal/Palace",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Heritage palace aesthetic on a budget: Rich golden velvet shamiana fabric draping paired with antique brass lanterns, fairy lights, and marigold strings.",
            vibe="Royal/Palace",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Family heirloom royal decor: Incorporate family antique brass thalis, vintage jharokha wooden frames, and traditional silk chunris for regal ceremony backdrops.",
            vibe="Royal/Palace",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Palace courtyard setting for less: Reusable earthen diyas with local mogra flower curtains and warm amber wash lighting instead of costly stage sets.",
            vibe="Royal/Palace",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text=f"Regal Rajputana courtyard styling in {city}: Brass urlis, velvet bolsters, royal shamianas, and candlelit courtyard walkways.",
            vibe="Royal/Palace",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Grand floral mandap using deep maroons, royal golden silks, and traditional carved jharokha wooden backdrops.",
            vibe="Royal/Palace",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Baraat welcome with fragrant rose petal showers from vintage balconies and live nagada dhol players.",
            vibe="Royal/Palace",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text=f"Imperial palace majesty in {city}: Multi-tiered crystal floral chandeliers, imported Persian rugs, and 24k gold leaf jharokha installations.",
            vibe="Royal/Palace",
            budget_tier="premium",
            category="theme",
        ),
        TaggedIdea(
            text="Grand palace facade architectural mapping with bespoke royal mirror-work canopies and cascading imported blooms.",
            vibe="Royal/Palace",
            budget_tier="premium",
            category="theme",
        ),
        TaggedIdea(
            text=f"Auspicious temple floral styling in {city}: Local yellow and orange marigolds (genda phool) with fresh mango leaf torans on reusable brass stands.",
            vibe="Traditional",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Traditional carved wooden mandap adorned with brass kuthuvilakku lamps, brass bells, and jasmine garlands.",
            vibe="Traditional",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Grand Vedic temple replica mandap with cascading white tuberoses, fresh lotus arrangements, and live classical carnatic ensemble.",
            vibe="Traditional",
            budget_tier="premium",
            category="theme",
        ),
        TaggedIdea(
            text="Contemporary clean aesthetic: Geometric brass arches with local baby's breath, seasonal foliage, and warm Edison filament bulbs.",
            vibe="Modern Minimal",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Blush pink, champagne gold, and eucalyptus green palette with geometric brass arches and sleek mirror aisle runners.",
            vibe="Modern Minimal",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Avant-garde contemporary design: Kinetic botanical ceiling installations, architectural mood lighting, and bespoke frosted acrylic mandap.",
            vibe="Modern Minimal",
            budget_tier="premium",
            category="theme",
        ),
        TaggedIdea(
            text="Zero-waste celebration: Seed-paper stationery, potted plant centerpieces, and reclaimed wooden ceremony structures.",
            vibe="Eco-friendly",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Solar-powered fairy lighting, organic local marigolds (genda phool), and natural terracotta kulhad service.",
            vibe="Eco-friendly",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Curated sustainable luxury: Living vertical botanical garden walls, carbon-neutral logistics, and artisanal handloom silk canopy drapery.",
            vibe="Eco-friendly",
            budget_tier="premium",
            category="theme",
        ),
        TaggedIdea(
            text=f"Scenic localized celebration in {city}: Breezy cotton drapery with local terracotta and floral accents.",
            vibe="Destination",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Breezy sunset mandap draping with ivory chiffons, pastel floral canopies, and localized handicrafts.",
            vibe="Destination",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Bespoke destination luxury: Sunset infinity-edge mandap with panoramic vistas, imported floral arches, and private golf-cart guest shuttles.",
            vibe="Destination",
            budget_tier="premium",
            category="theme",
        ),
        TaggedIdea(
            text="Vibrant carnival styling: Bright yellow marigolds, colorful Rajasthani umbrellas, and fairy light curtains.",
            vibe="Budget-smart",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="DIY photo booth with an upcycled vintage bicycle, floral cycle basket, and chalkboard milestone signs.",
            vibe="Budget-smart",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Multi-use ceremony stage that transitions seamlessly from Sangeet performances to the wedding altar.",
            vibe="Budget-smart",
            budget_tier="frugal",
            category="theme",
        ),
        # --- CATERING & MENU ---
        TaggedIdea(
            text="Royal feast on a budget: Signature regional royal thali prepared by renowned local halwais and traditional caterers.",
            vibe="All",
            budget_tier="frugal",
            category="catering",
            priority="Food",
        ),
        TaggedIdea(
            text="Interactive live street-food chaat counters: Dahi bhalla, sev puri, and customized flavoured golgappe shots.",
            vibe="All",
            budget_tier="frugal",
            category="catering",
        ),
        TaggedIdea(
            text=f"Regional Indian culinary highlights tailored for local tastes in {city}, paired with tandoori breads and slow-cooked dal makhani.",
            vibe="All",
            budget_tier="frugal",
            category="catering",
        ),
        TaggedIdea(
            text="Artisanal dessert spread featuring hot rabdi jalebi, kulfi falooda, and miniature gulab jamun cups.",
            vibe="All",
            budget_tier="frugal",
            category="catering",
        ),
        TaggedIdea(
            text="Late-night wedding fuel station: Masala cutting chai, South Indian filter coffee, and midnight snacks for baraatis.",
            vibe="All",
            budget_tier="frugal",
            category="catering",
        ),
        TaggedIdea(
            text="Elaborate royal multi-cuisine buffet featuring slow-cooked dum pukht biryani, regional breads, and artisanal sweet counters.",
            vibe="All",
            budget_tier="standard",
            category="catering",
            priority="Food",
        ),
        TaggedIdea(
            text="Curated mocktail bar with smoked saffron syrups, seasonal fruit coolers, and personalized couple signature drinks.",
            vibe="All",
            budget_tier="standard",
            category="catering",
        ),
        TaggedIdea(
            text="Chef-curated live gourmet tawa stations featuring seasonal regional delicacies and hand-crafted mocktails.",
            vibe="All",
            budget_tier="premium",
            category="catering",
            priority="Food",
        ),
        TaggedIdea(
            text="Masterchef live culinary theater: Molecular dessert counter, sous-vide regional delicacies, and bespoke international tasting stations.",
            vibe="All",
            budget_tier="premium",
            category="catering",
            priority="Food",
        ),
        # --- GUEST EXPERIENCE ---
        TaggedIdea(
            text="Welcome hospitality pouch in guest rooms with localized savory snacks, sweets, hydration packets, and wedding itinerary.",
            vibe="All",
            budget_tier="frugal",
            category="guest_exp",
        ),
        TaggedIdea(
            text="QR code printed on ceremony stationery for guests to instantly upload candid phone photos to a shared live gallery.",
            vibe="All",
            budget_tier="frugal",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Comfort station offering heel-friendly dancing flats (juttis/slippers) during high-energy Sangeet and Baraat.",
            vibe="All",
            budget_tier="frugal",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Live fragrance counter (attar bar) gifting guests bespoke roll-on fragrances in velvet pouches.",
            vibe="All",
            budget_tier="standard",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Personalized luxury concierge service, private chauffeured transfers, and curated welcome gift hampers with handcrafted brass souvenirs.",
            vibe="All",
            budget_tier="premium",
            category="guest_exp",
        ),
    ]
