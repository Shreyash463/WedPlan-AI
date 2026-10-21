import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TimelineTab } from "../src/components/tabs/TimelineTab";
import { CANONICAL_PHASES, TimelinePlan } from "../src/types";

describe("TimelineTab Component - Chronological Phase Ordering", () => {
  const mockTimeline: TimelinePlan = {
    days_remaining: 180,
    is_tight_timeline: false,
    phases: ["6+ Months", "3-4 Months", "1 Month", "Wedding Day"],
    tasks: [
      {
        id: "t1",
        title: "Pandit Muhurat",
        phase: "6+ Months",
        due_date: "2026-05-01",
        priority: "High",
        description: "Consult pandit",
        is_overdue_standard: false,
      },
      {
        id: "t2",
        title: "Photo Crew",
        phase: "3-4 Months",
        due_date: "2026-08-01",
        priority: "Normal",
        description: "Book photographers",
        is_overdue_standard: false,
      },
      {
        id: "t3",
        title: "Haldi Preparation",
        phase: "1 Month",
        due_date: "2026-10-20",
        priority: "Normal",
        description: "Buy yellow clothes",
        is_overdue_standard: false,
      },
      {
        id: "t4",
        title: "Pheras and Dakshina",
        phase: "Wedding Day",
        due_date: "2026-11-20",
        priority: "Urgent",
        description: "Coordinate envelopes",
        is_overdue_standard: false,
      },
      {
        id: "t5",
        title: "Urgent Overdue Task",
        phase: "1 Month",
        due_date: "2026-10-21",
        priority: "Urgent",
        description: "Overdue standard booking",
        is_overdue_standard: true,
      },
    ],
  };

  it("renders phase headers strictly in canonical chronological order", () => {
    render(<TimelineTab timelinePlan={mockTimeline} />);

    // Get all rendered phase headings
    const headings = screen.getAllByRole("heading", { level: 3 });
    const renderedPhaseNames = headings.map((h) => h.textContent?.trim());

    // Verify each rendered phase is in CANONICAL_PHASES and preserves order
    let lastIndex = -1;
    for (const name of renderedPhaseNames) {
      if (name) {
        const idx = CANONICAL_PHASES.indexOf(name);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeGreaterThan(lastIndex);
        lastIndex = idx;
      }
    }
  });

  it("renders the subtle amber badge for tasks overdue by standard lead time", () => {
    render(<TimelineTab timelinePlan={mockTimeline} />);

    expect(screen.getByText(/overdue by standard lead time/i)).toBeInTheDocument();
  });
});
