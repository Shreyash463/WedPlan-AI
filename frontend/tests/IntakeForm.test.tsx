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

  it("handles empty fields without coercing to 0 and formats on blur", () => {
    render(<IntakeForm onSubmit={vi.fn()} isLoading={false} />);

    const budgetInput = screen.getByLabelText(/total budget/i);
    // Clear the field
    fireEvent.change(budgetInput, { target: { value: "" } });
    expect(budgetInput).toHaveValue("");

    // Type 8515 - must not have leading zero
    fireEvent.change(budgetInput, { target: { value: "8515" } });
    expect(budgetInput).toHaveValue("8515");

    // Paste formatted Indian currency string
    fireEvent.change(budgetInput, { target: { value: "Rs 25,00,000" } });
    expect(budgetInput).toHaveValue("2500000");

    // On blur, format to Indian grouping
    fireEvent.blur(budgetInput);
    expect(budgetInput).toHaveValue("25,00,000");
  });

  it("validates budget range and links error via aria-describedby", () => {
    render(<IntakeForm onSubmit={vi.fn()} isLoading={false} />);

    const budgetInput = screen.getByLabelText(/total budget/i);

    // Enter budget below min (₹50,000)
    fireEvent.change(budgetInput, { target: { value: "10000" } });
    fireEvent.blur(budgetInput);

    expect(screen.getByText(/budget must be between ₹50,000 and ₹10,00,00,000/i)).toBeInTheDocument();
    expect(budgetInput).toHaveAttribute("aria-invalid", "true");

    // Correct to valid budget
    fireEvent.change(budgetInput, { target: { value: "1500000" } });
    fireEvent.blur(budgetInput);
    expect(screen.queryByText(/budget must be between ₹50,000 and ₹10,00,00,000/i)).not.toBeInTheDocument();
    expect(budgetInput).toHaveAttribute("aria-invalid", "false");
  });

  it("validates guest count range", () => {
    render(<IntakeForm onSubmit={vi.fn()} isLoading={false} />);

    const guestInput = screen.getByLabelText(/guest count/i);

    // Enter guests below min (10)
    fireEvent.change(guestInput, { target: { value: "5" } });
    fireEvent.blur(guestInput);

    expect(screen.getByText(/guest count must be between 10 and 5,000/i)).toBeInTheDocument();
    expect(guestInput).toHaveAttribute("aria-invalid", "true");

    // Correct to valid guest count
    fireEvent.change(guestInput, { target: { value: "150" } });
    fireEvent.blur(guestInput);
    expect(screen.queryByText(/guest count must be between 10 and 5,000/i)).not.toBeInTheDocument();
    expect(guestInput).toHaveAttribute("aria-invalid", "false");
  });

  it("blocks submission if required budget or guest count is empty or invalid", () => {
    const handleSubmit = vi.fn();
    render(<IntakeForm onSubmit={handleSubmit} isLoading={false} />);

    const budgetInput = screen.getByLabelText(/total budget/i);
    fireEvent.change(budgetInput, { target: { value: "" } });

    const submitBtn = screen.getByRole("button", { name: /generate wedding plan/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/budget is required/i)).toBeInTheDocument();
  });
});
