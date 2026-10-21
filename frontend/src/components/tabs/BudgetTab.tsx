import React, { useState, useEffect, useRef } from "react";
import {
  BudgetPlan,
  CityTier,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../../types";
import { formatCurrencyINR, formatPercentage } from "../../utils/formatters";
import { ProgressBar } from "../common/ProgressBar";
import { Badge } from "../common/Badge";
import { recalculatePlan } from "../../api/client";

interface BudgetTabProps {
  budgetPlan: BudgetPlan;
  city: string;
  cityTier: CityTier;
  weddingDate: string;
  functions: WeddingFunction[];
  style: WeddingStyle;
  initialPriorities: Priority[];
  onBudgetUpdated: (updatedPlan: BudgetPlan) => void;
}

const ALL_PRIORITIES: Priority[] = [
  "Food",
  "Venue & Decor",
  "Photography",
  "Music & Entertainment",
  "Attire & Jewellery",
  "Guest Experience",
];

export const BudgetTab: React.FC<BudgetTabProps> = ({
  budgetPlan,
  city,
  cityTier,
  weddingDate,
  functions,
  style,
  initialPriorities,
  onBudgetUpdated,
}) => {
  const [sliderBudget, setSliderBudget] = useState<number>(budgetPlan.total_budget);
  const [stepperGuests, setStepperGuests] = useState<number>(budgetPlan.guest_count);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>(initialPriorities);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state if props change from outside
  useEffect(() => {
    setSliderBudget(budgetPlan.total_budget);
    setStepperGuests(budgetPlan.guest_count);
  }, [budgetPlan.total_budget, budgetPlan.guest_count]);

  // Debounced recalculation effect
  useEffect(() => {
    // If no changes from current plan, skip
    if (
      sliderBudget === budgetPlan.total_budget &&
      stepperGuests === budgetPlan.guest_count &&
      JSON.stringify(selectedPriorities) === JSON.stringify(initialPriorities)
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel any ongoing recalculation request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsRecalculating(true);
      try {
        const res = await recalculatePlan(
          {
            wedding_date: weddingDate,
            city,
            city_tier: cityTier,
            total_budget: sliderBudget,
            guest_count: stepperGuests,
            functions,
            style,
            priorities: selectedPriorities,
          },
          abortControllerRef.current.signal
        );
        onBudgetUpdated(res.budget);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          // Log or silently ignore canceled requests
        }
      } finally {
        setIsRecalculating(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    sliderBudget,
    stepperGuests,
    selectedPriorities,
    weddingDate,
    city,
    cityTier,
    functions,
    style,
    budgetPlan.total_budget,
    budgetPlan.guest_count,
    initialPriorities,
    onBudgetUpdated,
  ]);

  const handlePriorityToggle = (p: Priority) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(p)) {
        return prev.filter((item) => item !== p);
      }
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

  const handleGuestStep = (delta: number) => {
    setStepperGuests((prev) => Math.max(10, Math.min(5000, prev + delta)));
  };

  return (
    <div className="budget-tab-container">
      {/* Interactive What-If Simulator Panel */}
      <section className="what-if-panel" aria-labelledby="what-if-heading">
        <div className="what-if-header">
          <h2 id="what-if-heading">
            Live What-If Simulator{" "}
            {isRecalculating && (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-primary)",
                  fontWeight: "normal",
                  marginLeft: "8px",
                }}
              >
                (Recomputing...)
              </span>
            )}
          </h2>
          <Badge type="health" value={budgetPlan.health_status} />
        </div>

        <div className="what-if-grid">
          {/* Budget Range Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <label htmlFor="budgetSlider">What-If Total Budget</label>
              <span style={{ color: "var(--color-primary)" }}>
                {formatCurrencyINR(sliderBudget)}
              </span>
            </div>
            <input
              id="budgetSlider"
              type="range"
              min={100000}
              max={15000000}
              step={50000}
              className="budget-slider"
              value={sliderBudget}
              onChange={(e) => setSliderBudget(Number(e.target.value))}
              aria-valuemin={100000}
              aria-valuemax={15000000}
              aria-valuenow={sliderBudget}
              aria-valuetext={formatCurrencyINR(sliderBudget)}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
              }}
            >
              <span>₹1 Lakh</span>
              <span>₹1.5 Crore</span>
            </div>
          </div>

          {/* Guest Count Stepper */}
          <div className="slider-group">
            <div className="slider-label-row">
              <label id="guestStepperLabel">What-If Guest Count</label>
              <span style={{ color: "var(--color-primary)" }}>
                {stepperGuests} Guests
              </span>
            </div>
            <div
              className="stepper-control"
              role="group"
              aria-labelledby="guestStepperLabel"
            >
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleGuestStep(-25)}
                aria-label="Decrease guest count by 25"
                disabled={stepperGuests <= 10}
              >
                -
              </button>
              <span className="stepper-value" aria-live="polite">
                {stepperGuests}
              </span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleGuestStep(25)}
                aria-label="Increase guest count by 25"
                disabled={stepperGuests >= 5000}
              >
                +
              </button>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              Per-guest spend: {formatCurrencyINR(budgetPlan.cost_per_guest)}
            </span>
          </div>

          {/* Priorities Re-weighting */}
          <div style={{ gridColumn: "1 / -1" }}>
            <span
              id="priorityToggleLabel"
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Active Priorities (Boosted Allocations):
            </span>
            <div
              role="group"
              aria-labelledby="priorityToggleLabel"
              className="chips-group"
            >
              {ALL_PRIORITIES.map((p) => {
                const isSelected = selectedPriorities.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`chip-btn ${isSelected ? "selected" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => handlePriorityToggle(p)}
                  >
                    <span aria-hidden="true">{isSelected ? "★" : "☆"}</span>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Concrete Planner Suggestions */}
      {budgetPlan.suggestions && budgetPlan.suggestions.length > 0 && (
        <div
          style={{
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            marginBottom: "var(--space-lg)",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              color: "var(--color-primary)",
              marginBottom: "8px",
            }}
          >
            💡 Smart Budget Optimization Suggestions
          </h3>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.95rem" }}>
            {budgetPlan.suggestions.map((sugg, idx) => (
              <li key={idx}>{sugg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Allocation Table with Pure CSS/SVG Bars */}
      <div className="budget-table-wrapper">
        <table className="budget-table" aria-label="Wedding Budget Allocations">
          <thead>
            <tr>
              <th scope="col" style={{ width: "30%" }}>Category</th>
              <th scope="col" style={{ width: "20%" }}>Allocated Amount</th>
              <th scope="col" style={{ width: "15%" }}>Share</th>
              <th scope="col" style={{ width: "35%" }}>Distribution Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {budgetPlan.allocations.map((alloc) => (
              <tr key={alloc.category}>
                <td>
                  <strong>{alloc.category}</strong>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {alloc.description}
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                  {formatCurrencyINR(alloc.amount)}
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>
                    {formatPercentage(alloc.percentage)}
                  </span>
                </td>
                <td>
                  <ProgressBar
                    percentage={alloc.percentage}
                    aria-label={`${alloc.category} ${alloc.percentage.toFixed(1)}%`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--color-surface-subtle)", fontWeight: 700 }}>
              <td>Total Reconciled Budget</td>
              <td style={{ color: "var(--color-primary)" }}>
                {formatCurrencyINR(budgetPlan.total_budget)}
              </td>
              <td>100.0%</td>
              <td>
                <span style={{ fontSize: "0.85rem", color: "var(--color-healthy)" }}>
                  ✓ Exact match (Hamilton/Hare Method)
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
