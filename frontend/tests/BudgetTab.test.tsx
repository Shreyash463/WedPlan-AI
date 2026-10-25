import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BudgetTab } from "../src/components/tabs/BudgetTab";
import { BudgetPlan } from "../src/types";

// Mock client recalculatePlan
vi.mock("../src/api/client", () => ({
  recalculatePlan: vi.fn().mockResolvedValue({
    budget: {
      total_budget: 4000000,
      guest_count: 400,
      cost_per_guest: 10000,
      health_status: "Healthy",
      health_description: "Healthy budget.",
      allocations: [
        {
          category: "Venue",
          amount: 800000,
          percentage: 20.0,
          description: "Venue rental",
        },
      ],
      warnings: [],
      suggestions: [],
    },
    timeline: { days_remaining: 100, is_tight_timeline: false, phases: [], tasks: [] },
    vendors: { categories: [] },
    days_remaining: 100,
    is_tight_timeline: false,
  }),
}));

const mockBudgetPlan: BudgetPlan = {
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
      description: "Lawn and banquet rental.",
    },
    {
      category: "Catering",
      amount: 750000,
      percentage: 30.0,
      description: "Buffet dining.",
    },
  ],
  warnings: [],
  suggestions: ["Consider booking early."],
};

describe("BudgetTab Component", () => {
  it("renders allocation table with amounts, percentages, and progress bars", () => {
    render(
      <BudgetTab
        budgetPlan={mockBudgetPlan}
        city="Jaipur"
        cityTier="Tier-2"
        weddingDate="2026-11-20"
        functions={["Wedding"]}
        style="Royal/Palace"
        initialPriorities={["Food"]}
        onBudgetUpdated={vi.fn()}
      />
    );

    expect(screen.getByRole("table", { name: /wedding budget allocations/i })).toBeInTheDocument();
    expect(screen.getByText("Lawn and banquet rental.")).toBeInTheDocument();
    expect(screen.getByText("Buffet dining.")).toBeInTheDocument();
    expect(screen.getAllByText(/₹25,00,000/i).length).toBeGreaterThanOrEqual(1);
  });

  it("updates guest count when clicking stepper controls", () => {
    render(
      <BudgetTab
        budgetPlan={mockBudgetPlan}
        city="Jaipur"
        cityTier="Tier-2"
        weddingDate="2026-11-20"
        functions={["Wedding"]}
        style="Royal/Palace"
        initialPriorities={["Food"]}
        onBudgetUpdated={vi.fn()}
      />
    );

    const incrementBtn = screen.getByRole("button", { name: /increase guest count by 25/i });
    fireEvent.click(incrementBtn);

    expect(screen.getByText("275")).toBeInTheDocument();
  });

  it("adjusts budget slider and triggers debounced recalculation", async () => {
    const handleUpdated = vi.fn();

    render(
      <BudgetTab
        budgetPlan={mockBudgetPlan}
        city="Jaipur"
        cityTier="Tier-2"
        weddingDate="2026-11-20"
        functions={["Wedding"]}
        style="Royal/Palace"
        initialPriorities={["Food"]}
        onBudgetUpdated={handleUpdated}
      />
    );

    const slider = screen.getByLabelText(/what-if total budget/i);
    fireEvent.change(slider, { target: { value: "3000000" } });

    await waitFor(
      () => {
        expect(handleUpdated).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it("verifies What-If panel contains exactly 2 numeric inputs and 0 empty inputs", () => {
    const { container } = render(
      <BudgetTab
        budgetPlan={mockBudgetPlan}
        city="Jaipur"
        cityTier="Tier-2"
        weddingDate="2026-11-20"
        functions={["Wedding"]}
        style="Royal/Palace"
        initialPriorities={["Food"]}
        onBudgetUpdated={vi.fn()}
      />
    );

    const simulatorSection = container.querySelector(".what-if-panel");
    expect(simulatorSection).toBeInTheDocument();

    // Check all inputs inside the simulator
    const allInputs = simulatorSection?.querySelectorAll("input") || [];
    // 1 range slider, 2 text/numeric inputs (exactBudgetInput, whatIfGuestInput)
    expect(allInputs.length).toBe(3);

    const numericTextInputs =
      simulatorSection?.querySelectorAll('input[type="text"], input[inputmode="numeric"]') || [];
    expect(numericTextInputs.length).toBe(2);

    const exactBudgetInput = screen.getByLabelText(/type exact budget in inr/i);
    const guestCountInput = screen.getByLabelText(/exact guest count/i);

    expect(exactBudgetInput).toBeInTheDocument();
    expect(guestCountInput).toBeInTheDocument();

    // Verify 0 empty inputs
    allInputs.forEach((input) => {
      expect((input as HTMLInputElement).value).not.toBe("");
    });
  });
});
