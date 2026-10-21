import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "../src/components/Dashboard";
import { PlanResponse, PlanFormInput } from "../src/types";

const mockPlan: PlanResponse = {
  overview: {
    couple_name: "Priya & Rohan",
    wedding_date: "2026-11-20",
    city: "Jaipur",
    city_tier: "Tier-2",
    guest_count: 250,
    total_budget: 2500000,
    cost_per_guest: 10000,
    days_remaining: 180,
    is_tight_timeline: false,
    health_status: "Healthy",
    summary: "Royal celebration in Jaipur for 250 guests with budget ₹25,00,000.",
    key_warnings: ["Keep an eye on peak season banquet bookings."],
  },
  budget: {
    total_budget: 2500000,
    guest_count: 250,
    cost_per_guest: 10000,
    health_status: "Healthy",
    health_description: "Healthy budget.",
    allocations: [
      {
        category: "Venue",
        amount: 500000,
        percentage: 20.0,
        description: "Lawn & banquet rental.",
      },
      {
        category: "Catering",
        amount: 750000,
        percentage: 30.0,
        description: "Live counters and mithai.",
      },
    ],
    warnings: [],
    suggestions: [],
  },
  timeline: {
    days_remaining: 180,
    is_tight_timeline: false,
    phases: ["6+ Months", "1 Month"],
    tasks: [
      {
        id: "t1",
        title: "Book Banquet",
        phase: "6+ Months",
        due_date: "2026-05-20",
        priority: "High",
        related_vendor_category: "Venue",
        description: "Lock palace lawn venue",
        is_overdue_standard: false,
      },
      {
        id: "t2",
        title: "Order Wedding Attire",
        phase: "1 Month",
        due_date: "2026-10-20",
        priority: "Normal",
        description: "Final bridal lehenga fittings",
        is_overdue_standard: false,
      },
    ],
  },
  vendors: {
    categories: [
      {
        id: "v1",
        name: "Catering Crew",
        allocated_budget: 750000,
        lead_time_weeks: 16,
        advance_payment_guidance: "25% on booking",
        questions_to_ask: ["Do you provide chaat stalls?"],
        contract_must_haves: ["Include tasting session"],
        default_status: "Not started",
      },
    ],
  },
  ideas: {
    overview_summary: "Royal Jaipur wedding themes.",
    themes_and_decor: ["Rajputana Brass urlis and marigold canopies"],
    catering_and_menu: ["Live street-food chaat counters"],
    function_activities: [{ function: "Haldi", activity: "Phoolon ki Holi" }],
    guest_experience_ideas: ["Welcome hospitality hamper"],
    money_saving_hacks: ["Trim 25 guests to save on catering"],
    ideas_source: "fallback",
  },
  generated_at: "2026-10-21T00:00:00Z",
  disclaimer: "All figures are planning estimates.",
};

const mockFormData: PlanFormInput = {
  couple_name: "Priya & Rohan",
  wedding_date: "2026-11-20",
  city: "Jaipur",
  city_tier: "Tier-2",
  total_budget: 2500000,
  guest_count: 250,
  functions: ["Haldi", "Wedding"],
  style: "Royal/Palace",
  priorities: ["Venue & Decor"],
};

describe("Dashboard Print Layout & Full Plan Copy", () => {
  let clipboardText = "";

  beforeEach(() => {
    clipboardText = "";
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn((text: string) => {
          clipboardText = text;
          return Promise.resolve();
        }),
      },
    });
  });

  it("renders dedicated #print-root with all 5 sections present in the DOM", () => {
    const { container } = render(
      <Dashboard
        initialPlan={mockPlan}
        formData={mockFormData}
        onEditDetails={vi.fn()}
      />
    );

    const printRoot = container.querySelector("#print-root");
    expect(printRoot).toBeInTheDocument();

    // Verify all key sections exist inside print root
    expect(printRoot?.textContent).toContain("Priya & Rohan's Wedding Master Plan");
    expect(printRoot?.textContent).toContain("1. Executive Summary & Alerts");
    expect(printRoot?.textContent).toContain("2. Budget Allocation Breakdown");
    expect(printRoot?.textContent).toContain("3. Countdown Preparation Roadmap");
    expect(printRoot?.textContent).toContain("4. Vendor Procurement Checklist");
    expect(printRoot?.textContent).toContain("5. Personalized Celebration Ideas");

    // Verify Budget table in print layout has amounts
    expect(printRoot?.textContent).toContain("5,00,000");
    expect(printRoot?.textContent).toContain("7,50,000");

    // Verify Timeline tasks in print layout
    expect(printRoot?.textContent).toContain("Book Banquet");
    expect(printRoot?.textContent).toContain("Order Wedding Attire");

    // Verify Vendor details in print layout
    expect(printRoot?.textContent).toContain("Catering Crew");
    expect(printRoot?.textContent).toContain("Do you provide chaat stalls?");

    // Verify Ideas in print layout
    expect(printRoot?.textContent).toContain("Rajputana Brass urlis");
    expect(printRoot?.textContent).toContain("Phoolon ki Holi");
    expect(printRoot?.textContent).toContain("Trim 25 guests to save");
  });

  it("copies complete full plan plain text covering all sections", async () => {
    render(
      <Dashboard
        initialPlan={mockPlan}
        formData={mockFormData}
        onEditDetails={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole("button", { name: /copy entire wedding plan/i });
    await act(async () => {
      copyBtn.click();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(clipboardText).toContain("WEDPLAN AI - COMPREHENSIVE INDIAN WEDDING PLAN");
    expect(clipboardText).toContain("Priya & Rohan");
    expect(clipboardText).toContain("BUDGET ALLOCATION BREAKDOWN");
    expect(clipboardText).toContain("COUNTDOWN TIMELINE ROADMAP");
    expect(clipboardText).toContain("VENDOR PROCUREMENT CHECKLIST");
    expect(clipboardText).toContain("PERSONALIZED CELEBRATION IDEAS");
    expect(clipboardText).toContain("Phoolon ki Holi");
  });
});
