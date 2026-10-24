"""Curated base pool of tagged Indian wedding celebration ideas."""

from __future__ import annotations

from backend.app.engine.data.ideas_data import TaggedIdea


def get_base_idea_pool(city: str) -> list[TaggedIdea]:
    """Return the master catalog of culturally curated, tagged Indian wedding ideas."""
    return [
        # Themes and Decor - Frugal / Tight
        TaggedIdea(
            text="Genda Phool (Marigold) Minimalism: Repurpose orange and yellow marigolds across Haldi and Mehendi ceremonies to cut decor waste.",
            vibe="All",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Brass Diyas & Floating Candle Walkways: Use local brass urlis and floating earthen diyas instead of expensive imported electric luminaries.",
            vibe="Traditional",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Botanical Greens & Cloth Drapes: Simple eucalyptus leaves and soft pastel georgette fabric swags for intimate daytime functions.",
            vibe="Modern Minimal",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Rajasthani Puppet & Bandhej Motifs: Use authentic fabric umbrellas and puppets for colorful, low-cost backdrop aesthetics.",
            vibe="Royal/Palace",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Zero-waste celebration: Seed-paper stationery, potted plant centerpieces, and reclaimed wooden ceremony structures.",
            vibe="Eco-friendly",
            budget_tier="frugal",
            category="theme",
        ),
        TaggedIdea(
            text="Fairylit Gazebo & Local Blooms: Focus illumination on a single photo zone canopy using local seasonal mogra and fairy lights.",
            vibe="Budget-smart",
            budget_tier="frugal",
            category="theme",
        ),
        # Themes and Decor - Standard / Comfortable
        TaggedIdea(
            text="Mogra Blossom Canopy: Hanging fragrant jasmine strings with ambient warm lantern lighting across dining walkways.",
            vibe="Traditional",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Rajputana Mirror-Work Backdrops: Intricate thikri mirror glass styling paired with velvet bolsters and antique brass lanterns.",
            vibe="Royal/Palace",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Monochrome Floral Elegance: Structured white tuberoses and baby's breath installations with warm geometric light framing.",
            vibe="Modern Minimal",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Sunset Coastal Pampas & Driftwood: Sunset-view mandap framed in natural jute rope, pampas grass, and terracotta accents.",
            vibe="Destination",
            budget_tier="standard",
            category="theme",
        ),
        TaggedIdea(
            text="Upcycled Khadi & Handloom Canopies: Sustainable organic cotton hangings and recycled copper vessels with seasonal foliage.",
            vibe="Eco-friendly",
            budget_tier="standard",
            category="theme",
        ),
        # Themes and Decor - Premium / Luxury
        TaggedIdea(
            text="Grand Thikri Glass Mosaic & Zari Pavilions: Museum-quality palace courtyard restoration look with bespoke royal chandeliers.",
            vibe="Royal/Palace",
            budget_tier="premium",
            category="theme",
        ),
        TaggedIdea(
            text="Temple Arch Carvings & Golden Kalash Installations: Magnificent stone-finish mandap with cascading scented tuberose canopies.",
            vibe="Traditional",
            budget_tier="premium",
            category="theme",
        ),
        # Catering & Menu - Frugal / Tight
        TaggedIdea(
            text="Live Street-Food Chaupati: Interactive chaat and dahi bhalla stations that guests love at a fraction of banquet buffet costs.",
            vibe="All",
            budget_tier="frugal",
            category="catering",
        ),
        TaggedIdea(
            text="Regional Thali Experience: Authentic brass or leaf thali service featuring signature regional dal, rotis, and seasonal sweets.",
            vibe="Traditional",
            budget_tier="frugal",
            category="catering",
        ),
        TaggedIdea(
            text="Seasonal Farm-to-Table Spread: Hearty millets (bajra khichdi), seasonal greens, and jaggery delicacies sourced directly from local farms.",
            vibe="Eco-friendly",
            budget_tier="frugal",
            category="catering",
        ),
        TaggedIdea(
            text="Focused 5-Item Signature Buffet: Reduce menu fatigue and kitchen waste by offering 5 impeccably executed signature regional dishes.",
            vibe="Budget-smart",
            budget_tier="frugal",
            category="catering",
        ),
        # Catering & Menu - Standard / Comfortable
        TaggedIdea(
            text="Royal Dum Pukht & Live Breads Counter: Slow-cooked handi biryanis with on-site live tandoor and naan makers.",
            vibe="Royal/Palace",
            budget_tier="standard",
            category="catering",
        ),
        TaggedIdea(
            text="Pan-Indian Regional Fusion: Combining Amritsari kulchas, Chettinad dosas, and Gujarati farsan at dedicated artisan counters.",
            vibe="Traditional",
            budget_tier="standard",
            category="catering",
        ),
        TaggedIdea(
            text="Artisan Mocktail & Cold-Pressed Station: Signature Indian botanicals like kokum fizz, khus cooler, and saffron badam milk.",
            vibe="Modern Minimal",
            budget_tier="standard",
            category="catering",
        ),
        TaggedIdea(
            text="Local Coastal Catch & Grills: Fresh regional coastal barbecue stations reflecting the destination.",
            vibe="Destination",
            budget_tier="standard",
            category="catering",
        ),
        # Guest Experience - Frugal / Tight
        TaggedIdea(
            text="Handwritten Welcome Postcards: Personalized handwritten notes from the couple in guest rooms celebrating their bond.",
            vibe="All",
            budget_tier="frugal",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Traditional Ittar & Rosewater Welcome: Greeting arriving guests with scented floral mist and natural attar swabs.",
            vibe="Traditional",
            budget_tier="frugal",
            category="guest_exp",
        ),
        TaggedIdea(
            text="QR-Coded Audio Guestbook: Guests scan a QR code to record voice notes and blessings straight to a shared digital archive.",
            vibe="Modern Minimal",
            budget_tier="frugal",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Seed Paper Favor Bookmarks: Plantable seed-paper wedding programs that blossom into wildflowers when potted by guests.",
            vibe="Eco-friendly",
            budget_tier="frugal",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Chai & Samosa Midnight Counter: Late-night cutting chai and samosa cart after the high-energy Sangeet performances.",
            vibe="Budget-smart",
            budget_tier="frugal",
            category="guest_exp",
        ),
        # Guest Experience - Standard / Comfortable
        TaggedIdea(
            text="Live Lac Bangle & Mehendi Craftsmen: Traditional craftsmen creating bespoke custom bangles for ladies during the Mehendi.",
            vibe="Royal/Palace",
            budget_tier="standard",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Bespoke Safa & Turban Tying Station: Vibrant kota doriya or bandhej safas tied live for baraatis with royal kalgis.",
            vibe="Traditional",
            budget_tier="standard",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Destination Welcome Hampers: Canvas tote bags with local spices, sweets, maps, and hangover revival kits.",
            vibe="Destination",
            budget_tier="standard",
            category="guest_exp",
        ),
        TaggedIdea(
            text="Zero-Plastic Steel Tumbler Station: Personalized laser-etched stainless steel bottles for all guests throughout the stay.",
            vibe="Eco-friendly",
            budget_tier="standard",
            category="guest_exp",
        ),
        # Money Saving Hacks - Frugal / Tight
        TaggedIdea(
            text="Dual-Ceremony Venue Booking: Host both Haldi and Mehendi in the same courtyard to waive secondary setup and rental surcharges.",
            vibe="All",
            budget_tier="frugal",
            category="money_hack",
        ),
        TaggedIdea(
            text="Morning Muhurat Catering Savings: A daytime wedding ceremony followed by lunch costs roughly 25-30% less than evening banquets.",
            vibe="Traditional",
            budget_tier="frugal",
            category="money_hack",
        ),
        TaggedIdea(
            text="BYO Brass & Silver Vessels: Rent heirloom silverware and brass ware from local community samaj bhavans rather than event decorators.",
            vibe="Royal/Palace",
            budget_tier="frugal",
            category="money_hack",
        ),
        TaggedIdea(
            text="Digital WhatsApp Video Invitations: Save 80% of stationery expenditure by distributing interactive animated video cards.",
            vibe="Modern Minimal",
            budget_tier="frugal",
            category="money_hack",
        ),
        TaggedIdea(
            text="Direct Farm Sourcing for Genda Phool: Buy marigold sacks directly from wholesale flower mandis at 4:00 AM on ceremony morning.",
            vibe="Eco-friendly",
            budget_tier="frugal",
            category="money_hack",
        ),
        TaggedIdea(
            text="Negotiate Single-Vendor Audio & Lighting: Bundle sound console, stage trussing, and ambient wash lights with one vendor for an instant package discount.",
            vibe="Budget-smart",
            budget_tier="frugal",
            category="money_hack",
        ),
    ]
