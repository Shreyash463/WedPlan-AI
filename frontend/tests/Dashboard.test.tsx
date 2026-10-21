import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dashboard } from "../src/components/Dashboard";
import { PlanResponse, PlanFormInput } from "../src/types";

const mockPlan: PlanResponse = {
  overview: {
    couple_name: "Priya & Rohan",
    wedding_date: "2026-11-20",
    city: "Jaipur",
    city_tier: "Tier-2",
    guest_count: 350,
    total_budget: 3500000,
    cost_per_guest: 10000,
    days_remaining: 180,
    is_tight_timeline: false,
    health_status: "Healthy",
    summary: "Royal celebration in Jaipur.",
    key_warnings: [],
  },
  budget: {
    total_budget: 3500000,
    guest_count: 350,
    cost_per_guest: 10000,
    health_status: "Healthy",
    health_description: "Healthy budget.",
    allocations: [
      {
        category: "Venue",
        amount: 700000,
        percentage: 20.0,
        description: "Banquet & lawn rental.",
      },
      {
        category: "Catering",
        amount: 1050000,
        percentage: 30.0,
        description: "Food and live counters.",
      },
    ],
    warnings: [],
    suggestions: [],
  },
  timeline: {
    days_remaining: 180,
    is_tight_timeline: false,
    phases: ["6+ Months Before"],
    tasks: [
      {
        id: "task_venue",
        title: "Book Venue",
        phase: "6+ Months Before",
        due_date: "2026-06-01",
        priority: "High",
        related_vendor_category: "Venue",
        description: "Secure palace lawn.",
      },
    ],
  },
  vendors: {
    categories: [
      {
        id: "vendor_venue",
        name: "Venue",
        allocated_budget: 700000,
        lead_time_weeks: 24,
        advance_payment_guidance: "25% on booking",
        questions_to_ask: ["Power backup?"],
        contract_must_haves: ["Refund clause"],
        default_status: "Not started",
      },
    ],
  },
  ideas: {
    overview_summary: "Royal Rajasthani decor.",
    themes_and_decor: ["Marigold mandap"],
    catering_and_menu: ["Live chaat"],
    function_activities: [{ function: "Wedding", activity: "Varmala" }],
    guest_experience_ideas: ["Welcome hampers"],
    money_saving_hacks: ["Local flowers"],
    ideas_source: "gemini",
  },
  generated_at: "2026-05-01T10:00:00Z",
  disclaimer: "Estimates for guidance.",
};

const mockFormData: PlanFormInput = {
  couple_name: "Priya & Rohan",
  wedding_date: "2026-11-20",
  city: "Jaipur",
  city_tier: "Tier-2",
  total_budget: 3500000,
  guest_count: 350,
  functions: ["Wedding"],
  style: "Royal/Palace",
  priorities: ["Food"],
};

describe("Dashboard Component", () => {
  it("renders 5 tabs with ARIA roles and default Overview selected", async () => {
    render(
      <Dashboard
        initialPlan={mockPlan}
        formData={mockFormData}
        onEditDetails={vi.fn()}
      />
    );

    const tablist = screen.getByRole("tablist", { name: /planning sections/i });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Overview panel is visible
    await waitFor(() => {
      expect(screen.getByText(/total planned budget/i)).toBeInTheDocument();
    });
  });

  it("navigates tabs via arrow keys", async () => {
    render(
      <Dashboard
        initialPlan={mockPlan}
        formData={mockFormData}
        onEditDetails={vi.fn()}
      />
    );

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    overviewTab.focus();

    // Press ArrowRight to move to Budget tab
    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });

    const budgetTab = screen.getByRole("tab", { name: /budget/i });
    expect(budgetTab).toHaveAttribute("aria-selected", "true");
  });

  it("switches to timeline tab and checks task", async () => {
    render(
      <Dashboard
        initialPlan={mockPlan}
        formData={mockFormData}
        onEditDetails={vi.fn()}
      />
    );

    const timelineTab = screen.getByRole("tab", { name: /timeline/i });
    fireEvent.click(timelineTab);

    await waitFor(() => {
      expect(screen.getByText("Book Venue")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox", { name: /mark task completed: book venue/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("handles copy plan and print buttons", async () => {
    render(
      <Dashboard
        initialPlan={mockPlan}
        formData={mockFormData}
        onEditDetails={vi.fn()}
      />
    );

    const printBtn = screen.getByRole("button", { name: /print or download/i });
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalledTimes(1);

    const copyBtn = screen.getByRole("button", { name: /copy entire wedding plan/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
  });
});
