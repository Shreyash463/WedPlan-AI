"""Vendor profiles, contract requirements, and guidance data catalog."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class VendorProfileDef:
    """Immutable definition of an Indian wedding vendor profile."""

    id: str
    name: str
    budget_key: str
    lead_time_weeks: int
    advance_guidance: str
    questions_to_ask: tuple[str, ...]
    contract_must_haves: tuple[str, ...]
    function_filter: str | None = None


MASTER_VENDOR_PROFILES: tuple[VendorProfileDef, ...] = (
    VendorProfileDef(
        id="vendor_venue",
        name="Wedding & Reception Venue",
        budget_key="Venue",
        lead_time_weeks=26,
        advance_guidance="25% on signing date, 50% one month prior, 25% on event check-in.",
        questions_to_ask=(
            "Does the rental fee include rooms for immediate family to change and rest?",
            "What is the noise curfew policy for late-night music and Baraat dhol?",
            "Are there preferred/exclusive vendor restrictions for decorators and caterers?",
            "What is the exact backup power (silent DG) capacity in case of grid outage?",
        ),
        contract_must_haves=(
            "Explicit check-in and check-out timestamps with hourly overtime penalties stated.",
            "Written inclusion of electricity units, air conditioning runtime, and cleaning fees.",
            "Weather contingency clause for outdoor lawns (tarpaulin/rain-proof shed provision).",
            "Force Majeure refund or date rescheduling policy.",
        ),
    ),
    VendorProfileDef(
        id="vendor_catering",
        name="Catering & Banquet Dining",
        budget_key="Catering",
        lead_time_weeks=18,
        advance_guidance="20% booking token, 50% after menu food trials, 30% morning of event.",
        questions_to_ask=(
            "Can you accommodate pure vegetarian, vegan, and Jain counters without garlic/onion?",
            "What is the ratio of service stewards per guest table during buffet and seated service?",
            "How do you bill extra plates if actual attendance exceeds the guaranteed minimum by 10-15%?",
            "Are chafing dish displays, bone china crockery, and cloth napkins included in per-plate price?",
        ),
        contract_must_haves=(
            "Signed itemized menu card detailing every appetizer, main course, and dessert counter.",
            "Plate count reconciliation procedure (token system or entry counter agreed in writing).",
            "Food safety guarantee and left-over food disposal / donation protocol.",
            "Live station chef uniforms and hygiene standards stipulated.",
        ),
    ),
    VendorProfileDef(
        id="vendor_decor",
        name="Decor, Stage & Mandap Floral Stylist",
        budget_key="Decor & Florals",
        lead_time_weeks=12,
        advance_guidance="30% on 3D design approval, 40% on setup day, 30% post-ceremony teardown.",
        questions_to_ask=(
            "Will fresh seasonal blooms (marigold, tuberose, roses) or artificial silk flowers be used on the mandap?",
            "At what hour will your setup crew begin venue transformation on the event morning?",
            "Do you provide ambient warm fairy lighting, uplighters, and generator wiring for the stage?",
            "Are entrance welcome signboards, photo booths, and floral varmalas included?",
        ),
        contract_must_haves=(
            "Approved 3D renderings and mood board attached as an annexure to the agreement.",
            "Penalties for delayed handover (minimum 3 hours prior to guest arrival).",
            "Explicit breakdown of flower grades (fresh A-grade Indian / exotic imported stems).",
            "Teardown and venue handover responsibility clearly assigned to decorator.",
        ),
    ),
    VendorProfileDef(
        id="vendor_photo",
        name="Photography & Cinematography Crew",
        budget_key="Photography & Video",
        lead_time_weeks=16,
        advance_guidance="25% on booking, 50% on wedding day completion, 25% upon final album delivery.",
        questions_to_ask=(
            "Will the lead photographer personally shoot our main wedding rituals?",
            "How many dedicated candid cameras, traditional video rigs, and drone operators will be on-site?",
            "What is the exact delivery timeline for teaser reels, 4K wedding film, and printed albums?",
            "Do you back up raw memory card files on dual hard drives immediately after each event?",
        ),
        contract_must_haves=(
            "Named lead photographer with emergency substitute clause of equal seniority.",
            "Delivery milestone dates (e.g. 7 days for teaser, 45 days for full film and photo proofs).",
            "Ownership and copyright license allowing the couple full sharing rights.",
            "Raw footage preservation for at least 12 months after the wedding.",
        ),
    ),
    VendorProfileDef(
        id="vendor_attire",
        name="Bridal Lehengas & Groom Attire",
        budget_key="Attire & Jewellery",
        lead_time_weeks=12,
        advance_guidance="50% deposit upon placing order, 50% on final fitting trial.",
        questions_to_ask=(
            "How many fitting alterations are included before the final delivery date?",
            "Can you customize blouse neckline, sleeve embroidery, and dupatta edging?",
            "What is the margin left inside the seams for post-marriage size adjustments?",
            "Are matching accessories (safa fabric, pocket square, matching juttis) provided?",
        ),
        contract_must_haves=(
            "Written promised delivery date at least 21 days before the first wedding function.",
            "Detailed fabric, thread type (zardozi, gota patti), and color swatch code specified.",
            "Free alteration guarantee until the wedding week.",
            "Refund or compensation clause for delayed delivery beyond agreed date.",
        ),
    ),
    VendorProfileDef(
        id="vendor_music",
        name="DJ, Sound & Baraat Dhol Players",
        budget_key="Music & Entertainment",
        lead_time_weeks=10,
        advance_guidance="25% at booking, 50% at rehearsal sound check, 25% after performance.",
        questions_to_ask=(
            "Do you provide your own line-array sound speakers, cordless microphones, and DJ console?",
            "Can we share a strict 'Do Not Play' list and a custom Bollywood/Punjabi playlist?",
            "Are you licensed by PPL / IPRS for public music performance at banquets?",
            "How many authentic Punjabi dhol players are included for the Baraat procession?",
        ),
        contract_must_haves=(
            "Equipment specifications (speaker wattage, cordless mics, monitor wedges) listed.",
            "Setup completion time locked 2 hours before soundcheck.",
            "Overtime hourly charge rate clearly capped in writing.",
            "Baraat procession route coverage and generator power coordination confirmed.",
        ),
    ),
    VendorProfileDef(
        id="vendor_makeup",
        name="Bridal Makeup & Mehendi Artists",
        budget_key="Makeup & Mehendi",
        lead_time_weeks=8,
        function_filter="Mehendi",
        advance_guidance="30% on paid makeup trial, 50% on event morning, 20% on final touchup.",
        questions_to_ask=(
            "Do you use HD or airbrush makeup products suited for tropical Indian humidity?",
            "How many assistants are accompanying you to dress immediate mothers and sisters?",
            "Is pre-bridal skincare consultation and faux lash application included?",
            "What is your arrival buffer time before the Baraat arrives at the venue?",
        ),
        contract_must_haves=(
            "Guaranteed lead artist attendance (no junior replacement without written consent).",
            "Specified high-end brands (MAC, Bobbi Brown, Charlotte Tilbury, Estée Lauder).",
            "Travel and lodging allowances clearly specified if outside home city.",
            "Sanitized brushes and single-use applicator hygiene clause.",
        ),
    ),
    VendorProfileDef(
        id="vendor_stationery",
        name="Wedding Invitations & Gifting Hampers",
        budget_key="Invitations & Stationery",
        lead_time_weeks=8,
        advance_guidance="50% advance for print plate making, 50% on physical delivery.",
        questions_to_ask=(
            "What is the turnaround time for physical hard-copy card proofreading?",
            "Do you also format mobile-friendly animated PDF/MP4 video WhatsApp itineraries?",
            "Can you assemble and shrink-wrap mithai / dry fruit gifting hampers?",
            "Are addressing stickers and personalized guest name printing supported?",
        ),
        contract_must_haves=(
            "Signed print proof with explicit spelling, Sanskrit shloka, and phone number sign-off.",
            "Guaranteed spare card count (at least 5% buffer cards included).",
            "Packaging quality guarantee against transport dampness.",
            "Delivery milestone at least 6 weeks before wedding date.",
        ),
    ),
    VendorProfileDef(
        id="vendor_logistics",
        name="Guest Transport, Fleet & Hotel Hospitality",
        budget_key="Logistics, Transport & Stay",
        lead_time_weeks=6,
        advance_guidance="30% booking advance, 50% on vehicle dispatch, 20% on final odometer reconciliation.",
        questions_to_ask=(
            "Are drivers uniformed and briefed on wedding venue routes and parking zones?",
            "What is the fuel, toll tax, state border permit, and driver night bhatta policy?",
            "Can you station a 24/7 dedicated fleet coordinator at the main hotel porch?",
            "Do buses have functioning air-conditioning and luggage luggage compartments?",
        ),
        contract_must_haves=(
            "Vehicle model and year of manufacture (not older than 3 years) specified.",
            "Cleanliness and AC guarantee with penalty deductions for breakdowns.",
            "Odometer start/end verification sheet signed by family coordinator daily.",
            "Replacement vehicle provided within 45 minutes in case of mechanical fault.",
        ),
    ),
)
