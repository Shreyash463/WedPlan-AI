import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { VendorsTab } from "../src/components/tabs/VendorsTab";
import { OverviewTab } from "../src/components/tabs/OverviewTab";
import { VendorPlan, OverviewData, BudgetPlan, TimelinePlan } from "../src/types";

const mockVendorPlan: VendorPlan = {
  categories: [
    {
      id: "vendor_venue",
      name: "Wedding & Reception Venue",
      allocated_budget: 450000,
      lead_time_weeks: 26, // 182 days
      advance_payment_guidance: "25% on signing date",
      questions_to_ask: ["Noise curfew?"],
      contract_must_haves: ["Check-in timestamp"],
      default_status: "Not started",
    },
    {
      id: "vendor_stationery",
      name: "Wedding Invitations & Gifting Hampers",
      allocated_budget: 50000,
      lead_time_weeks: 8, // 56 days
      advance_payment_guidance: "50% advance",
      questions_to_ask: ["Proof turnaround?"],
      contract_must_haves: ["Print proof signoff"],
      default_status: "Not started",
    },
  ],
};

const mockOverview: OverviewData = {
  wedding_date: "2026-11-21",
  city: "Pune",
  city_tier: "Tier-2",
  guest_count: 200,
  total_budget: 1500000,
  cost_per_guest: 7500,
  days_remaining: 30,
  is_tight_timeline: false,
  health_status: "Healthy",
  summary: "A celebration in Pune.",
  key_warnings: ["Buffer 5% contingency."],
};

const mockBudget: BudgetPlan = {
  total_budget: 1500000,
  guest_count: 200,
  cost_per_guest: 7500,
  health_status: "Healthy",
  health_description: "Comfortable hospitality.",
  allocations: [
    { category: "Venue", percentage: 20, amount: 300000, description: "Venue fee" },
  ],
  warnings: ["Buffer 5% contingency."],
  suggestions: ["Opt for weekday."],
};

const mockTimeline: TimelinePlan = {
  days_remaining: 30,
  is_tight_timeline: false,
  phases: ["1 Month"],
  tasks: [
    {
      id: "t1",
      title: "Confirm ceremony schedule",
      phase: "1 Month",
      due_date: "2026-10-31",
      priority: "High",
      description: "Review timings.",
    },
  ],
};

describe("VendorsTab - Overdue & Soon Status Badges", () => {
  it("renders red 'Overdue: book now' badge when Book By date is in the past", () => {
    // Wedding is 2026-11-21.
    // Venue lead time is 26 weeks = 182 days before wedding -> Book By is ~May 2026.
    // Today is 2026-10-22, so Book By is in the past!
    render(
      <VendorsTab
        vendorPlan={mockVendorPlan}
        weddingDate="2026-11-21"
        today="2026-10-22"
      />
    );

    const overdueBadges = screen.getAllByText(/Overdue: book now/i);
    expect(overdueBadges.length).toBeGreaterThanOrEqual(1);
    expect(overdueBadges[0].closest(".vendor-badge-overdue")).toBeInTheDocument();
  });

  it("renders 'Book soon' badge when Book By date is within 14 days", () => {
    // Wedding is 2026-11-21.
    // Stationery lead time is 8 weeks = 56 days before wedding -> Book By is 2026-09-26.
    // If today is 2026-09-20, diff is 6 days (within 14 days) -> Book soon!
    render(
      <VendorsTab
        vendorPlan={mockVendorPlan}
        weddingDate="2026-11-21"
        today="2026-09-20"
      />
    );

    const bookSoonBadges = screen.getAllByText(/Book soon/i);
    expect(bookSoonBadges.length).toBeGreaterThanOrEqual(1);
    expect(bookSoonBadges[0].closest(".vendor-badge-soon")).toBeInTheDocument();
  });

  it("renders no badge when Book By date is far in the future (> 14 days)", () => {
    // Wedding is 2027-11-21 (more than 1 year away).
    // Stationery Book by is September 2027.
    // Today is 2026-10-22, so book by date is ~330 days in future!
    render(
      <VendorsTab
        vendorPlan={mockVendorPlan}
        weddingDate="2027-11-21"
        today="2026-10-22"
      />
    );

    expect(screen.queryByText(/Overdue: book now/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Book soon/i)).not.toBeInTheDocument();
  });
});

describe("OverviewTab - Overdue Vendors Smart Planner Alert", () => {
  it("surfaces compact overdue warning with impact ranking and collapsible vendor list", () => {
    render(
      <OverviewTab
        overview={mockOverview}
        budget={mockBudget}
        timeline={mockTimeline}
        functions={["Wedding"]}
        vendors={mockVendorPlan}
        weddingDate="2026-11-21"
        today="2026-10-22"
        completedTaskIds={[]}
        onToggleTask={() => {}}
        disclaimer="Estimates only."
      />
    );

    // Should render the compact warning with impact ranking
    expect(
      screen.getByText(/past their standard booking window/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Book these first: Venue/i)
    ).toBeInTheDocument();

    // Collapsible accordion button
    const toggleBtn = screen.getByRole("button", { name: /Show all \d+ overdue vendors/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

    // Click to expand all overdue vendors
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Wedding & Reception Venue")).toBeInTheDocument();
  });
});
