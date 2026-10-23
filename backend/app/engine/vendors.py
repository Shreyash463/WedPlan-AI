"""Vendor checklist and contracts engine linked with budget allocations."""

from __future__ import annotations

from backend.app.models import (
    BudgetPlan,
    VendorCategoryItem,
    VendorPlan,
    VendorStatusEnum,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)

MASTER_VENDOR_PROFILES = [
    {
        "id": "vendor_venue",
        "name": "Wedding & Reception Venue",
        "budget_key": "Venue",
        "lead_time_weeks": 26,
        "function_filter": None,
        "advance_guidance": "25% on signing date, 50% one month prior, 25% on event check-in.",
        "questions_to_ask": [
            "Does the rental fee include rooms for immediate family to change and rest?",
            "What is the noise curfew policy for late-night music and Baraat dhol?",
            "Are there preferred/exclusive vendor restrictions for decorators and caterers?",
            "What is the exact backup power (silent DG) capacity in case of grid outage?",
        ],
        "contract_must_haves": [
            "Explicit check-in and check-out timestamps with hourly overtime penalties stated.",
            "Written inclusion of electricity units, air conditioning runtime, and cleaning fees.",
            "Weather contingency clause for outdoor lawns (tarpaulin/rain-proof shed provision).",
            "Force Majeure refund or date rescheduling policy.",
        ],
    },
    {
        "id": "vendor_catering",
        "name": "Catering & Banquet Dining",
        "budget_key": "Catering",
        "lead_time_weeks": 18,
        "function_filter": None,
        "advance_guidance": "20% booking token, 50% after menu food trials, 30% morning of event.",
        "questions_to_ask": [
            "Can you accommodate pure vegetarian, vegan, and Jain counters without garlic/onion?",
            "What is the ratio of service stewards per guest table during buffet and seated service?",
            "How do you bill extra plates if actual attendance exceeds the guaranteed minimum by 10-15%?",
            "Are chafing dish displays, bone china crockery, and cloth napkins included in per-plate price?",
        ],
        "contract_must_haves": [
            "Signed itemized menu card detailing every appetizer, main course, and dessert counter.",
            "Plate count reconciliation procedure (token system or entry counter agreed in writing).",
            "Food safety guarantee and left-over food disposal / donation protocol.",
            "Live station chef uniforms and hygiene standards stipulated.",
        ],
    },
    {
        "id": "vendor_decor",
        "name": "Decor, Stage & Mandap Floral Stylist",
        "budget_key": "Decor & Florals",
        "lead_time_weeks": 12,
        "function_filter": None,
        "advance_guidance": "30% on 3D design approval, 40% on setup day, 30% post-ceremony teardown.",
        "questions_to_ask": [
            "Will fresh seasonal blooms (marigold, tuberose, roses) or artificial silk flowers be used on the mandap?",
            "At what hour will your setup crew begin venue transformation on the event morning?",
            "Do you provide ambient warm fairy lighting, uplighters, and generator wiring for the stage?",
            "Are entrance welcome signboards, photo booths, and floral varmalas included?",
        ],
        "contract_must_haves": [
            "Approved 3D renderings and mood board attached as an annexure to the agreement.",
            "Penalties for delayed handover (minimum 3 hours prior to guest arrival).",
            "Explicit breakdown of flower grades (fresh A-grade Indian / exotic imported stems).",
            "Teardown and venue handover responsibility clearly assigned to decorator.",
        ],
    },
    {
        "id": "vendor_photo",
        "name": "Photography & Cinematography Crew",
        "budget_key": "Photography & Video",
        "lead_time_weeks": 16,
        "function_filter": None,
        "advance_guidance": "25% on booking, 50% on wedding day completion, 25% upon final album delivery.",
        "questions_to_ask": [
            "Will the lead photographer personally shoot our main wedding rituals?",
            "How many dedicated candid cameras, traditional video rigs, and drone operators will be on-site?",
            "What is the exact delivery timeline for teaser reels, 4K wedding film, and printed albums?",
            "Do you back up raw memory card files on dual hard drives immediately after each event?",
        ],
        "contract_must_haves": [
            "Named lead photographer with emergency substitute clause of equal seniority.",
            "Delivery milestone dates (e.g. 7 days for teaser, 45 days for full film and photo proofs).",
            "Ownership and copyright license allowing the couple full sharing rights.",
            "Raw footage preservation for at least 12 months after the wedding.",
        ],
    },
    {
        "id": "vendor_attire",
        "name": "Bridal Lehengas & Groom Attire",
        "budget_key": "Attire & Jewellery",
        "lead_time_weeks": 12,
        "function_filter": None,
        "advance_guidance": "50% deposit upon placing order, 50% on final fitting trial.",
        "questions_to_ask": [
            "How many fitting alterations are included before the final delivery date?",
            "Can you customize blouse neckline, sleeve embroidery, and dupatta edging?",
            "What is the margin left inside the seams for post-marriage size adjustments?",
            "Are matching accessories (safa fabric, pocket square, matching juttis) provided?",
        ],
        "contract_must_haves": [
            "Written promised delivery date at least 21 days before the first wedding function.",
            "Detailed fabric, thread type (zardozi, gota patti), and color swatch code specified.",
            "Free alteration guarantee until the wedding week.",
            "Refund or compensation clause for delayed delivery beyond agreed date.",
        ],
    },
    {
        "id": "vendor_music",
        "name": "DJ, Sound & Baraat Dhol Players",
        "budget_key": "Music & Entertainment",
        "lead_time_weeks": 10,
        "function_filter": None,
        "advance_guidance": "25% at booking, 50% at rehearsal sound check, 25% after performance.",
        "questions_to_ask": [
            "Do you provide your own line-array sound speakers, cordless microphones, and DJ console?",
            "Can we share a strict 'Do Not Play' list and a custom Bollywood/Punjabi playlist?",
            "Are you licensed by PPL / IPRS for public music performance at banquets?",
            "How many authentic Punjabi dhol players are included for the Baraat procession?",
        ],
        "contract_must_haves": [
            "Equipment specifications (speaker wattage, cordless mics, monitor wedges) listed.",
            "Setup completion time locked 2 hours before soundcheck.",
            "Overtime hourly fee specified in advance.",
            "Liability coverage for equipment failure with backup console on site.",
        ],
    },
    {
        "id": "vendor_mehendi",
        "name": "Bridal & Guest Mehendi Artists",
        "budget_key": "Makeup & Mehendi",
        "lead_time_weeks": 12,
        "function_filter": "Mehendi",
        "advance_guidance": "20% token, balance in cash after bridal mehendi application.",
        "questions_to_ask": [
            "Are the henna cones 100% natural and free of chemical black dye (PPD)?",
            "How many assistant artists will accompany you to apply henna for 50-100 female guests?",
            "Can you incorporate customized motifs (couple portraits, wedding hashtags, skylines)?",
            "What after-care instructions and clove smoke/lemon-sugar sealant do you provide?",
        ],
        "contract_must_haves": [
            "Guarantee that lead artist applies the bride's henna personally.",
            "Count of assistant artists and guest handling capacity specified.",
            "Skin-safe organic chemical-free henna warranty.",
            "Cancellation and replacement policy.",
        ],
    },
    {
        "id": "vendor_makeup",
        "name": "Bridal Makeup Artist (MUA) & Hair Stylist",
        "budget_key": "Makeup & Mehendi",
        "lead_time_weeks": 14,
        "function_filter": None,
        "advance_guidance": "30% on booking date, remaining 70% immediately after wedding look completion.",
        "questions_to_ask": [
            "Does the package include paid trials, eyelashes, hair extensions, and saree/dupatta draping?",
            "Which high-definition/airbrush cosmetic brands (MAC, Charlotte Tilbury, NARS) will be used?",
            "Will you travel to our venue dressing suite or require us to visit the studio?",
            "How many family members (mothers, sisters) can your team style simultaneously?",
        ],
        "contract_must_haves": [
            "Named principal makeup artist specified (no unannounced junior replacements).",
            "Exact arrival time at the venue green room.",
            "Draping services explicitly included in written quote.",
            "Touch-up duration before the Varmala and Pheras stated.",
        ],
    },
    {
        "id": "vendor_stationery",
        "name": "Wedding Invitations & Gifting Hampers",
        "budget_key": "Invitations & Stationery",
        "lead_time_weeks": 8,
        "function_filter": None,
        "advance_guidance": "50% advance for raw card printing & hamper boxes, 50% on courier dispatch.",
        "questions_to_ask": [
            "Do you provide animated MP4 video invites and interactive WhatsApp RSVP web links?",
            "What is the minimum order quantity for luxury printed boxes with dry fruit jars?",
            "What is the proofreading and digital PDF mock-up revision turnaround time?",
            "Can you handle direct courier shipping to outstation guests?",
        ],
        "contract_must_haves": [
            "Print proof sign-off before full run production.",
            "Exact paper GSM, foil stamping quality, and box dimensions written down.",
            "Buffer copies (extra 20-30 cards/envelopes) included without surcharge.",
            "Guaranteed delivery date before planned dispatch.",
        ],
    },
    {
        "id": "vendor_logistics",
        "name": "Transport, Shuttles & Room Blocking",
        "budget_key": "Logistics, Transport & Stay",
        "lead_time_weeks": 8,
        "function_filter": None,
        "advance_guidance": "30% on vehicle reservation, 50% fuel and advance on event day, 20% reconciliation.",
        "questions_to_ask": [
            "Are 12-seater / 20-seater AC tempo travellers available for airport-to-venue shuttles?",
            "Do drivers have active GPS navigation and clean local route experience?",
            "What is the per-kilometer excess rate and night allowance charge for drivers?",
            "Can welcome luggage tags and bottled water crates be pre-placed in each vehicle?",
        ],
        "contract_must_haves": [
            "Registration numbers, clean air-conditioned vehicles, and verified driver contact list.",
            "Replacement vehicle within 45 minutes in event of vehicle breakdown.",
            "Toll taxes, parking fees, and driver meals clearly specified as included or extra.",
            "Flexible route adjustment for spontaneous elder family pickups.",
        ],
    },
]


def generate_vendor_plan(
    functions: list[WeddingFunctionEnum],
    budget_plan: BudgetPlan,
    budget_band: str = "Comfortable",
    style: WeddingStyleEnum | str = "Traditional",
) -> VendorPlan:
    """Generate curated vendor checklist with linked allocated budgets and context-aware guidelines."""
    selected_func_names = [f.value for f in functions]

    # Map category budget allocations
    budget_map: dict[str, int] = {alloc.category: alloc.amount for alloc in budget_plan.allocations}

    is_royal_or_destination = style in (
        WeddingStyleEnum.ROYAL_PALACE,
        WeddingStyleEnum.DESTINATION,
        "Royal/Palace",
        "Destination",
    )
    categories: list[VendorCategoryItem] = []

    for prof in MASTER_VENDOR_PROFILES:
        func_filter = prof["function_filter"]
        if func_filter is not None and func_filter not in selected_func_names:
            continue

        budget_key = prof["budget_key"]
        allocated_amt = budget_map.get(budget_key, 0)

        # For Makeup & Mehendi split: if both MUA and Mehendi exist, partition the category reasonably
        if budget_key == "Makeup & Mehendi" and "Mehendi" in selected_func_names:
            if prof["id"] == "vendor_mehendi":
                allocated_amt = int(allocated_amt * 0.40)
            elif prof["id"] == "vendor_makeup":
                allocated_amt = int(allocated_amt * 0.60)

        advance_guidance = prof["advance_guidance"]
        questions = list(prof["questions_to_ask"])
        contract_must_haves = list(prof["contract_must_haves"])

        # Context-aware vendor profile wording variants based on budget band
        if prof["id"] == "vendor_decor":
            if budget_band == "Tight":
                advance_guidance = "30% on moodboard approval, 40% on setup day, 30% post-ceremony teardown."
                contract_must_haves = [
                    "Approved stage layout and mood board attached as an annexure to the agreement.",
                    "Penalties for delayed handover (minimum 3 hours prior to guest arrival).",
                    "Explicit breakdown of flower grades (fresh seasonal local blooms).",
                    "Teardown and venue handover responsibility clearly assigned to decorator.",
                ]
            elif budget_band == "Comfortable":
                advance_guidance = "30% on design mockup approval, 40% on setup day, 30% post-ceremony teardown."
                contract_must_haves = [
                    "Approved design sketches and mood board attached as an annexure to the agreement.",
                    "Penalties for delayed handover (minimum 3 hours prior to guest arrival).",
                    "Explicit breakdown of flower grades (fresh A-grade Indian blooms).",
                    "Teardown and venue handover responsibility clearly assigned to decorator.",
                ]
            elif budget_band == "Premium":
                advance_guidance = "30% on 3D design approval, 40% on setup day, 30% post-ceremony teardown."
                contract_must_haves = [
                    "Approved 3D renderings and mood board attached as an annexure to the agreement.",
                    "Penalties for delayed handover (minimum 3 hours prior to guest arrival).",
                    "Explicit breakdown of flower grades (fresh A-grade Indian / exotic imported stems).",
                    "Teardown and venue handover responsibility clearly assigned to decorator.",
                ]

        elif prof["id"] == "vendor_photo":
            if budget_band == "Tight":
                questions = [
                    "Will the lead photographer personally shoot our main wedding rituals?",
                    "How many dedicated candid cameras and traditional video operators will be on-site?",
                    "What is the exact delivery timeline for teaser reels, highlights film, and printed albums?",
                    "Do you back up raw memory card files on dual hard drives immediately after each event?",
                ]
            elif budget_band == "Premium" and is_royal_or_destination:
                questions = [
                    "Will the lead photographer personally shoot our main wedding rituals?",
                    "How many dedicated candid cameras, traditional video rigs, and drone operators will be on-site?",
                    "What is the exact delivery timeline for teaser reels, 4K wedding film, and printed albums?",
                    "Do you back up raw memory card files on dual hard drives immediately after each event?",
                ]
            else:
                questions = [
                    "Will the lead photographer personally shoot our main wedding rituals?",
                    "How many dedicated candid cameras and traditional video rigs will be on-site?",
                    "What is the exact delivery timeline for teaser reels, full film, and printed albums?",
                    "Do you back up raw memory card files on dual hard drives immediately after each event?",
                ]

        categories.append(
            VendorCategoryItem(
                id=prof["id"],
                name=prof["name"],
                allocated_budget=allocated_amt,
                lead_time_weeks=prof["lead_time_weeks"],
                advance_payment_guidance=advance_guidance,
                questions_to_ask=questions,
                contract_must_haves=contract_must_haves,
                default_status=VendorStatusEnum.NOT_STARTED,
            )
        )

    return VendorPlan(categories=categories)
