import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { IntakeForm } from "../src/components/IntakeForm";

describe("IntakeForm Component", () => {
  it("renders form with accessible landmark, heading, and visible labels", () => {
    render(<IntakeForm onSubmit={vi.fn()} isLoading={false} />);

    expect(screen.getByRole("region", { name: /plan your dream indian wedding/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/wedding city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total budget/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/guest count/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate wedding plan/i })).toBeInTheDocument();
  });

  it("shows tight timeline notice if date is within 14 days", () => {
    // Set date 5 days from today
    const tightDate = new Date();
    tightDate.setDate(tightDate.getDate() + 5);
    const dateStr = tightDate.toISOString().split("T")[0];

    render(
      <IntakeForm
        onSubmit={vi.fn()}
        isLoading={false}
        initialValues={{
          wedding_date: dateStr,
          city: "Delhi",
          city_tier: "Metro",
          total_budget: 2000000,
          guest_count: 200,
          functions: ["Wedding"],
          style: "Traditional",
          priorities: [],
        }}
      />
    );

    expect(screen.getByText(/very tight timeline notice/i)).toBeInTheDocument();
  });

  it("calls onSubmit with valid form data", () => {
    const handleSubmit = vi.fn();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const dateStr = futureDate.toISOString().split("T")[0];

    render(
      <IntakeForm
        onSubmit={handleSubmit}
        isLoading={false}
        initialValues={{
          couple_name: "Priya & Rohan",
          wedding_date: dateStr,
          city: "Jaipur",
          city_tier: "Tier-2",
          total_budget: 3000000,
          guest_count: 300,
          functions: ["Haldi", "Wedding"],
          style: "Royal/Palace",
          priorities: ["Food"],
          special_requests: "Vegetarian only",
        }}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /generate wedding plan/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        couple_name: "Priya & Rohan",
        city: "Jaipur",
        total_budget: 3000000,
        guest_count: 300,
        style: "Royal/Palace",
      })
    );
  });
});
