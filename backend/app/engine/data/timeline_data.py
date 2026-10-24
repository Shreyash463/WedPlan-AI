"""Timeline countdown phases and task templates data catalog."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

CANONICAL_PHASES: tuple[str, ...] = (
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
)


@dataclass(frozen=True, slots=True)
class TaskTemplateDef:
    """Immutable definition of a milestone task template."""

    id: str
    title: str
    days_before: int
    base_priority: Literal["Urgent", "High", "Normal"]
    vendor: str
    function: str | None
    description: str


TASK_TEMPLATES: tuple[TaskTemplateDef, ...] = (
    TaskTemplateDef(
        id="task_pandit_muhurat",
        title="Consult Pandit / Officiant for Shubh Muhurat",
        days_before=240,
        base_priority="High",
        vendor="Pandit / Priest",
        function=None,
        description="Lock auspicious lagna muhurat timings for Pheras, Baraat arrival, and Vidaai.",
    ),
    TaskTemplateDef(
        id="task_venue_booking",
        title="Book Wedding & Reception Venues",
        days_before=210,
        base_priority="High",
        vendor="Venue",
        function=None,
        description="Secure banquet halls or palace lawns; verify air conditioning, power backup, and liquor permits.",
    ),
    TaskTemplateDef(
        id="task_caterer_tasting",
        title="Catering Tasting & Menu Finalization",
        days_before=150,
        base_priority="High",
        vendor="Catering",
        function=None,
        description="Conduct food trials for chaat counters, live stalls, regional signature dishes, and dessert spreads.",
    ),
    TaskTemplateDef(
        id="task_photo_booking",
        title="Book Photography & Cinematography Crew",
        days_before=120,
        base_priority="High",
        vendor="Photography & Video",
        function=None,
        description="Confirm candid photographers, traditional videographers, drone pilots, and pre-wedding shoot dates.",
    ),
    TaskTemplateDef(
        id="task_mehendi_artist",
        title="Book Bridal Mehendi Artist & Team",
        days_before=100,
        base_priority="High",
        vendor="Makeup & Mehendi",
        function="Mehendi",
        description="Book bridal henna specialist and assistant artists for female guests; test organic henna stain.",
    ),
    TaskTemplateDef(
        id="task_sangeet_choreographer",
        title="Hire Sangeet Choreographer & DJ",
        days_before=90,
        base_priority="Normal",
        vendor="Music & Entertainment",
        function="Sangeet",
        description="Select family performance songs, create custom musical mixes, and schedule weekend dance rehearsals.",
    ),
    TaskTemplateDef(
        id="task_attire_shopping",
        title="Order Bridal Lehenga & Groom Sherwani",
        days_before=90,
        base_priority="High",
        vendor="Attire & Jewellery",
        function=None,
        description="Allow 8-10 weeks for bespoke bridal embroidery (zardozi/gota patti), dupatta matching, and groom safa color coordination.",
    ),
    TaskTemplateDef(
        id="task_decor_mandap",
        title="Finalize Mandap, Floral & Lighting Designs",
        days_before=60,
        base_priority="Normal",
        vendor="Decor & Florals",
        function=None,
        description="Approve 3D stage renders, floral colour palette (marigold/jasmine/roses), entrance arch, and pathway fairy lights.",
    ),
    TaskTemplateDef(
        id="task_invitations",
        title="Send Wedding E-Invites & Boxed Cards",
        days_before=45,
        base_priority="Normal",
        vendor="Invitations & Stationery",
        function=None,
        description="Dispatch printed wedding cards with mithai hampers to elders; distribute digital video invites and WhatsApp itineraries.",
    ),
    TaskTemplateDef(
        id="task_haldi_prep",
        title="Haldi Ceremony Props & Yellow Outfits",
        days_before=30,
        base_priority="Normal",
        vendor="Decor & Florals",
        function="Haldi",
        description="Arrange floral jewellery, urli tubs for turmeric bath, yellow dupattas, dholki players, and organic ubtan.",
    ),
    TaskTemplateDef(
        id="task_guest_rooms",
        title="Confirm Guest Accommodation & Shuttles",
        days_before=21,
        base_priority="Normal",
        vendor="Logistics, Transport & Stay",
        function=None,
        description="Map out airport/railway station pickup timetables and rooming lists with welcome hampers at hotel desks.",
    ),
    TaskTemplateDef(
        id="task_attire_final_trials",
        title="Final Outfits & Jewellery Fitting Trials",
        days_before=14,
        base_priority="High",
        vendor="Attire & Jewellery",
        function=None,
        description="Conduct full trial wearing footwear, jewellery, and can-can underskirts; ensure comfortable draping.",
    ),
    TaskTemplateDef(
        id="task_baraat_dhol",
        title="Coordinate Baraat Brass Band, Safa & Vintage Car / Ghodi",
        days_before=7,
        base_priority="High",
        vendor="Music & Entertainment",
        function=None,
        description="Verify arrival time for Baraat brass band, Punjabi dholis, safa/turban tying expert, and route permissions.",
    ),
    TaskTemplateDef(
        id="task_soundcheck",
        title="Soundcheck, Generator & Cold Pyro Rehearsal",
        days_before=2,
        base_priority="Normal",
        vendor="Decor & Florals",
        function=None,
        description="Verify on-site silent DG generator backup, sound clarity, varmala stage hydraulic lift, and cold pyro fire permits.",
    ),
    TaskTemplateDef(
        id="task_wedding_day",
        title="Ceremony Execution & Dakshina Envelopes",
        days_before=0,
        base_priority="High",
        vendor="Venue",
        function=None,
        description="Designate a family coordinator with cash envelopes (shagun/dakshina), ensure bridal green room snacks, and execute muhurat.",
    ),
    TaskTemplateDef(
        id="task_post_vendor_settlement",
        title="Post-Wedding Vendor Settlements & Photo Selection",
        days_before=-7,
        base_priority="Normal",
        vendor="Photography & Video",
        function=None,
        description="Reconcile extra plates with caterer, clear final balances with decorators, and shortlist album photos.",
    ),
)
