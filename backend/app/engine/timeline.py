"""Timeline countdown roadmap engine with intelligent short-notice compression."""

from __future__ import annotations

from datetime import date, timedelta

from backend.app.models import (
    TaskPriorityEnum,
    TimelinePlan,
    TimelineTask,
    WeddingFunctionEnum,
    WeddingStyleEnum,
)

# Standard template tasks: (id, title, months_before_offset, days_before_offset, base_priority, vendor_category, required_function, description)
# Note: we support both days_before_offset and months approximation
TASK_TEMPLATES = [
    {
        "id": "task_pandit_muhurat",
        "title": "Consult Pandit / Officiant for Shubh Muhurat",
        "days_before": 240,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Pandit / Priest",
        "function": None,
        "description": "Lock auspicious lagna muhurat timings for Pheras, Baraat arrival, and Vidaai.",
    },
    {
        "id": "task_venue_booking",
        "title": "Book Wedding & Reception Venues",
        "days_before": 210,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Venue",
        "function": None,
        "description": "Secure banquet halls or palace lawns; verify air conditioning, power backup, and liquor permits.",
    },
    {
        "id": "task_caterer_tasting",
        "title": "Catering Tasting & Menu Finalization",
        "days_before": 150,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Catering",
        "function": None,
        "description": "Conduct food trials for chaat counters, live stalls, regional signature dishes, and dessert spreads.",
    },
    {
        "id": "task_photo_booking",
        "title": "Book Photography & Cinematography Crew",
        "days_before": 120,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Photography & Video",
        "function": None,
        "description": "Confirm candid photographers, traditional videographers, drone pilots, and pre-wedding shoot dates.",
    },
    {
        "id": "task_mehendi_artist",
        "title": "Book Bridal Mehendi Artist & Team",
        "days_before": 100,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Makeup & Mehendi",
        "function": "Mehendi",
        "description": "Book bridal henna specialist and assistant artists for female guests; test organic henna stain.",
    },
    {
        "id": "task_sangeet_choreographer",
        "title": "Hire Sangeet Choreographer & DJ",
        "days_before": 90,
        "base_priority": TaskPriorityEnum.NORMAL,
        "vendor": "Music & Entertainment",
        "function": "Sangeet",
        "description": "Select family performance songs, create custom musical mixes, and schedule weekend dance rehearsals.",
    },
    {
        "id": "task_attire_shopping",
        "title": "Order Bridal Lehenga & Groom Sherwani",
        "days_before": 90,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Attire & Jewellery",
        "function": None,
        "description": "Allow 8-10 weeks for bespoke bridal embroidery (zardozi/gota patti), dupatta matching, and groom safa color coordination.",
    },
    {
        "id": "task_decor_mandap",
        "title": "Finalize Mandap, Floral & Lighting Designs",
        "days_before": 60,
        "base_priority": TaskPriorityEnum.NORMAL,
        "vendor": "Decor & Florals",
        "function": None,
        "description": "Approve 3D stage renders, floral colour palette (marigold/jasmine/roses), entrance arch, and pathway fairy lights.",
    },
    {
        "id": "task_invitations",
        "title": "Send Wedding E-Invites & Boxed Cards",
        "days_before": 45,
        "base_priority": TaskPriorityEnum.NORMAL,
        "vendor": "Invitations & Stationery",
        "function": None,
        "description": "Dispatch printed wedding cards with mithai hampers to elders; distribute digital video invites and WhatsApp itineraries.",
    },
    {
        "id": "task_haldi_prep",
        "title": "Haldi Ceremony Props & Yellow Outfits",
        "days_before": 30,
        "base_priority": TaskPriorityEnum.NORMAL,
        "vendor": "Decor & Florals",
        "function": "Haldi",
        "description": "Arrange floral jewellery, urli tubs for turmeric bath, yellow dupattas, dholki players, and organic ubtan.",
    },
    {
        "id": "task_guest_rooms",
        "title": "Confirm Guest Accommodation & Shuttles",
        "days_before": 21,
        "base_priority": TaskPriorityEnum.NORMAL,
        "vendor": "Logistics, Transport & Stay",
        "function": None,
        "description": "Map out airport/railway station pickup timetables and rooming lists with welcome hampers at hotel desks.",
    },
    {
        "id": "task_attire_final_trials",
        "title": "Final Outfits & Jewellery Fitting Trials",
        "days_before": 14,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Attire & Jewellery",
        "function": None,
        "description": "Conduct full trial wearing footwear, jewellery, and can-can underskirts; ensure comfortable draping.",
    },
    {
        "id": "task_baraat_dhol",
        "title": "Coordinate Baraat Brass Band, Safa & Vintage Car / Ghodi",
        "days_before": 7,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Music & Entertainment",
        "function": None,
        "description": "Verify arrival time for Baraat brass band, Punjabi dholis, safa/turban tying expert, and route permissions.",
    },
    {
        "id": "task_soundcheck",
        "title": "Soundcheck, Generator & Cold Pyro Rehearsal",
        "days_before": 2,
        "base_priority": TaskPriorityEnum.NORMAL,
        "vendor": "Decor & Florals",
        "function": None,
        "description": "Verify on-site silent DG generator backup, sound clarity, varmala stage hydraulic lift, and cold pyro fire permits.",
    },
    {
        "id": "task_wedding_day",
        "title": "Ceremony Execution & Dakshina Envelopes",
        "days_before": 0,
        "base_priority": TaskPriorityEnum.HIGH,
        "vendor": "Venue",
        "function": None,
        "description": "Designate a family coordinator with cash envelopes (shagun/dakshina), ensure bridal green room snacks, and execute muhurat.",
    },
    {
        "id": "task_post_vendor_settlement",
        "title": "Post-Wedding Vendor Settlements & Photo Selection",
        "days_before": -7,  # 7 days after
        "base_priority": TaskPriorityEnum.NORMAL,
        "vendor": "Photography & Video",
        "function": None,
        "description": "Reconcile extra plates with caterer, clear final balances with decorators, and shortlist album photos.",
    },
]


CANONICAL_PHASES: list[str] = [
    "6+ Months",
    "5-6 Months",
    "3-4 Months",
    "2 Months",
    "1 Month",
    "2 Weeks",
    "Final Week",
    "Final 72 Hours",
    "Wedding Day",
    "After Wedding",
]


def determine_phase_name(days_before: int) -> str:
    """Map day offset to canonical countdown phase names."""
    if days_before < 0:
        return "After Wedding"
    if days_before == 0:
        return "Wedding Day"
    if days_before <= 3:
        return "Final 72 Hours"
    if days_before <= 7:
        return "Final Week"
    if days_before <= 14:
        return "2 Weeks"
    if days_before <= 30:
        return "1 Month"
    if days_before <= 60:
        return "2 Months"
    if days_before <= 120:
        return "3-4 Months"
    if days_before <= 180:
        return "5-6 Months"
    return "6+ Months"


def generate_timeline_plan(
    wedding_date: date,
    functions: list[WeddingFunctionEnum],
    style: WeddingStyleEnum,
    current_date: date | None = None,
    budget_band: str = "Comfortable",
) -> TimelinePlan:
    """Generate dynamic timeline tasks with chronological ordering, overdue tracking, and budget-band wording."""
    today = current_date or date.today()
    days_remaining = (wedding_date - today).days
    is_tight_timeline = days_remaining <= 14

    selected_func_names = [f.value for f in functions]
    is_royal_or_destination = style in (
        WeddingStyleEnum.ROYAL_PALACE,
        WeddingStyleEnum.DESTINATION,
        "Royal/Palace",
        "Destination",
    )
    tasks: list[TimelineTask] = []

    for tmpl in TASK_TEMPLATES:
        # Check function filter
        req_func = tmpl["function"]
        if req_func is not None and req_func not in selected_func_names:
            continue

        raw_days_before = tmpl["days_before"]

        # Calculate nominal due date
        target_date = wedding_date - timedelta(days=raw_days_before)

        # Check if overdue based on standard offset
        is_overdue = target_date < today and raw_days_before >= 0
        priority = tmpl["base_priority"]

        if is_overdue:
            # Overdue by standard lead time: schedule for today, mark overdue and urgent
            priority = TaskPriorityEnum.URGENT
            scheduled_date = min(wedding_date, today)
        else:
            # Scheduled normally; never schedule before today
            scheduled_date = max(target_date, today)

        effective_days_before = (wedding_date - scheduled_date).days
        phase = determine_phase_name(effective_days_before)

        desc = tmpl["description"]
        title = tmpl["title"]

        # Context-aware wording variants based on budget band & style
        if tmpl["id"] == "task_photo_booking":
            if budget_band == "Tight":
                title = "Book Photography & Videography Team"
                desc = "Confirm essential candid and traditional photographers, schedule family portrait shots."
            elif budget_band == "Premium" and is_royal_or_destination:
                title = "Book Cinematic Photo & Drone Filmmaking Crew"
                desc = "Confirm master candid photographers, 4K cinematographers, licensed drone pilots, and pre-wedding shoot dates."
            else:
                title = "Book Photography & Cinematography Crew"
                desc = "Confirm candid photographers, traditional videographers, and pre-wedding shoot dates."

        elif tmpl["id"] == "task_decor_mandap":
            if budget_band == "Tight":
                title = "Finalize Mandap, Floral & Lighting Designs"
                desc = "Approve stage layout, seasonal floral colour palette (marigold/jasmine), entrance arch, and pathway fairy lights."
            elif budget_band == "Premium":
                title = "Finalize 3D Stage Renders, Floral & Architectural Lighting"
                desc = "Approve 3D stage renders, premium floral installations, entrance arch, and architectural spotlighting."
            else:
                title = "Finalize Mandap, Floral & Lighting Designs"
                desc = "Approve stage mood boards, floral colour palette (marigold/roses), entrance arch, and ambient warm fairy lights."

        elif tmpl["id"] == "task_soundcheck":
            if budget_band == "Tight" or style == WeddingStyleEnum.BUDGET_SMART:
                title = "Soundcheck, Generator & Ceremony Audio Rehearsal"
                desc = "Verify on-site generator power backup, mic sound clarity, and wedding ceremony music playlist."
            elif budget_band == "Premium" and is_royal_or_destination:
                title = "Soundcheck, Generator & Cold Pyro Rehearsal"
                desc = "Verify on-site silent DG generator backup, sound clarity, varmala stage hydraulic lift, and cold pyro fire permits."
            else:
                title = "Soundcheck, DJ Rehearsal & DG Power Backup"
                desc = "Verify on-site silent DG generator backup, acoustic sound clarity, and stage ceremony timing."

        tasks.append(
            TimelineTask(
                id=tmpl["id"],
                title=title,
                phase=phase,
                due_date=scheduled_date.isoformat(),
                priority=priority,
                related_vendor_category=tmpl["vendor"],
                description=desc,
                is_overdue_standard=is_overdue,
            )
        )

    # Sort tasks:
    # 1. due_date ascending (chronological order)
    # 2. priority (Urgent -> High -> Normal)
    # 3. id as stable tie breaker
    priority_order = {
        TaskPriorityEnum.URGENT: 0,
        TaskPriorityEnum.HIGH: 1,
        TaskPriorityEnum.NORMAL: 2,
    }

    tasks.sort(
        key=lambda t: (
            t.due_date,
            priority_order.get(t.priority, 2),
            t.id,
        )
    )

    # Phases strictly in CANONICAL_PHASES order, containing only phases that have tasks
    present_phases = {t.phase for t in tasks}
    phases_in_order = [p for p in CANONICAL_PHASES if p in present_phases]

    return TimelinePlan(
        days_remaining=days_remaining,
        is_tight_timeline=is_tight_timeline,
        phases=phases_in_order,
        tasks=tasks,
    )
