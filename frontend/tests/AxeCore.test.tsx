import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "vitest-axe";
import { IntakeForm } from "../src/components/IntakeForm";
import { OverviewTab } from "../src/components/tabs/OverviewTab";
import { BudgetTab } from "../src/components/tabs/BudgetTab";
import { TimelineTab } from "../src/components/tabs/TimelineTab";
import { VendorsTab } from "../src/components/tabs/VendorsTab";
import { IdeasTab } from "../src/components/tabs/IdeasTab";
import { PlanResponse } from "../src/types";

const samplePlan: PlanResponse = {
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
      { category: "Venue", amount: 700000, percentage: 20.0, description: "Banquet & lawn rental." },
      { category: "Catering", amount: 1050000, percentage: 30.0, description: "Food counters." },
    ],
    warnings: [],
    suggestions: [],
  },
  timeline: {
    days_remaining: 180,
    is_tight_timeline: false,
    phases: ["6+ Months"],
    tasks: [
      {
        id: "task_venue",
        title: "Book Venue",
        phase: "6+ Months",
        due_date: "2026-05-20",
        priority: "Urgent",
        related_vendor_category: "Venue",
        description: "Finalize venue contract.",
      },
    ],
  },
  vendors: {
    categories: [
      {
        id: "cat_venue",
        name: "Venue & Lawn",
        allocated_budget: 700000,
        lead_time_weeks: 24,
        advance_payment_guidance: "25% on booking, balance on event week.",
        questions_to_ask: ["What is curfew?"],
        contract_must_haves: ["Signed banquet contract"],
        default_status: "Not started",
      },
    ],
  },
  ideas: {
    overview_summary: "Palace theme with marigold accents.",
    themes_and_decor: ["Royal Rajasthani decor"],
    catering_and_menu: ["Dal Baati Churma counters"],
    function_activities: [{ function: "Wedding", activity: "Pheras" }],
    guest_experience_ideas: ["Welcome turbans"],
    money_saving_hacks: ["Off-peak morning slot"],
  },
  generated_at: "2026-10-24T12:00:00Z",
  disclaimer: "Estimates only.",
};

describe("Axe-Core Automated Accessibility Verification", () => {
  it("IntakeForm has zero critical accessibility violations", async () => {
    const { container } = render(
      <IntakeForm onSubmit={() => {}} isLoading={false} />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("OverviewTab has zero accessibility violations", async () => {
    const { container } = render(
      <OverviewTab
        overview={samplePlan.overview}
        budget={samplePlan.budget}
        timeline={samplePlan.timeline}
        functions={["Wedding"]}
        vendors={samplePlan.vendors}
        completedTaskIds={[]}
        onToggleTask={() => {}}
        disclaimer="Estimates only"
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("BudgetTab has zero accessibility violations", async () => {
    const { container } = render(
      <BudgetTab
        budgetPlan={samplePlan.budget}
        city="Jaipur"
        cityTier="Tier-2"
        weddingDate="2026-11-20"
        functions={["Wedding"]}
        style="Royal/Palace"
        initialPriorities={["Food"]}
        onBudgetUpdated={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("TimelineTab has zero accessibility violations", async () => {
    const { container } = render(
      <TimelineTab
        timelinePlan={samplePlan.timeline}
        completedTasks={[]}
        onToggleTask={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("VendorsTab has zero accessibility violations", async () => {
    const { container } = render(
      <VendorsTab
        vendorPlan={samplePlan.vendors}
        weddingDate="2026-11-20"
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("IdeasTab has zero accessibility violations", async () => {
    const { container } = render(
      <IdeasTab
        ideasPlan={samplePlan.ideas}
        city="Jaipur"
        cityTier="Tier-2"
        totalBudget={3500000}
        guestCount={350}
        functions={["Wedding"]}
        style="Royal/Palace"
        priorities={["Food"]}
        onIdeasUpdated={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
