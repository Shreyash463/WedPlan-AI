import React, { useState, useEffect, useRef } from "react";
import {
  BudgetPlan,
  CityTier,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../../types";
import {
  formatCurrencyCompactINR,
  formatCurrencyINR,
  formatPercentage,
} from "../../utils/formatters";
import { Badge } from "../common/Badge";
import { recalculatePlan } from "../../api/client";
import { CATEGORY_COLORS } from "./OverviewTab";
import { MinusIcon, PlusIcon, RupeeIcon, UsersIcon } from "../common/Icons";

interface BudgetTabProps {
  budgetPlan: BudgetPlan;
  originalBudget?: number;
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

const MIN_BUDGET = 50_000;
const MAX_BUDGET = 100_000_000;
const LOG_MIN = Math.log(MIN_BUDGET);
const LOG_MAX = Math.log(MAX_BUDGET);

function budgetToSlider(b: number): number {
  const clamped = Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, b));
  return Math.round(((Math.log(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);
}

function sliderToBudget(val: number): number {
  const b = Math.exp(LOG_MIN + (val / 1000) * (LOG_MAX - LOG_MIN));
  if (b < 1_000_000) {
    return Math.round(b / 10_000) * 10_000;
  }
  if (b < 10_000_000) {
    return Math.round(b / 50_000) * 50_000;
  }
  return Math.round(b / 100_000) * 100_000;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  budgetPlan,
  originalBudget,
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
  const [displayMode, setDisplayMode] = useState<"inr" | "percentage">("inr");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state if props change from outside
  useEffect(() => {
    setSliderBudget(budgetPlan.total_budget);
    setStepperGuests(budgetPlan.guest_count);
  }, [budgetPlan.total_budget, budgetPlan.guest_count]);

  // Debounced recalculation effect
  useEffect(() => {
    if (
      sliderBudget === budgetPlan.total_budget &&
      stepperGuests === budgetPlan.guest_count &&
      JSON.stringify(selectedPriorities) === JSON.stringify(initialPriorities)
    ) {
      return;
    }

    const timer = setTimeout(async () => {
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
          // Ignore canceled requests
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

  const handleExactBudgetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSliderBudget(Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, val)));
    }
  };

  // Delta calculation vs original plan
  const baseBudget = originalBudget ?? budgetPlan.total_budget;
  const budgetDelta = sliderBudget - baseBudget;

  return (
    <div className="budget-tab-container">
      {/* Interactive What-If Simulator Panel */}
      <section className="what-if-panel" aria-labelledby="what-if-heading">
        <div className="what-if-header">
          <div>
            <h2 id="what-if-heading" className="what-if-title">
              Instant What-If Budget Simulator
            </h2>
            <p className="what-if-subtitle">
              Adjust budget, guest count, or priorities to immediately test feasibility. Pure instant calculation, zero AI latency.
            </p>
          </div>
          <div className="what-if-status-badges">
            {isRecalculating && <span className="recalculating-pill">Recomputing...</span>}
            <Badge type="health" value={budgetPlan.health_status} />
          </div>
        </div>

        <div className="what-if-grid">
          {/* Budget Range Slider + Synchronized Input */}
          <div className="simulator-field-group">
            <div className="field-label-row">
              <label htmlFor="budgetSlider" className="simulator-label">
                <RupeeIcon size={16} /> What-If Total Budget (INR)
              </label>
              <div className="delta-container">
                {budgetDelta === 0 ? (
                  <span className="delta-pill neutral">Original Budget</span>
                ) : budgetDelta > 0 ? (
                  <span className="delta-pill positive">+{formatCurrencyCompactINR(budgetDelta)} vs original</span>
                ) : (
                  <span className="delta-pill negative">-{formatCurrencyCompactINR(Math.abs(budgetDelta))} vs original</span>
                )}
              </div>
            </div>

            <div className="budget-input-sync-row">
              <div className="budget-slider-wrapper">
                <input
                  id="budgetSlider"
                  type="range"
                  min={0}
                  max={1000}
                  step={1}
                  className="budget-slider"
                  value={budgetToSlider(sliderBudget)}
                  onChange={(e) => setSliderBudget(sliderToBudget(Number(e.target.value)))}
                  aria-label="What-If Total Budget"
                />
                <div className="slider-ticks">
                  <span>{formatCurrencyCompactINR(MIN_BUDGET)}</span>
                  <span>₹25 L</span>
                  <span>₹1 Cr</span>
                  <span>{formatCurrencyCompactINR(MAX_BUDGET)}</span>
                </div>
              </div>

              <div className="exact-input-wrapper">
                <label htmlFor="exactBudgetInput" className="sr-only">Type exact budget amount</label>
                <div className="rupee-input-prefix">₹</div>
                <input
                  id="exactBudgetInput"
                  type="number"
                  min={MIN_BUDGET}
                  max={MAX_BUDGET}
                  step={10000}
                  value={sliderBudget}
                  onChange={handleExactBudgetInput}
                  className="exact-budget-input"
                  aria-label="Type exact budget in INR"
                />
              </div>
            </div>
          </div>

          {/* Guest Count Stepper + Number Input */}
          <div className="simulator-field-group">
            <div className="field-label-row">
              <label htmlFor="whatIfGuestInput" className="simulator-label">
                <UsersIcon size={16} /> Guest Count: <span className="stepper-val-text">{stepperGuests}</span>
              </label>
              <span className="per-guest-calc">
                {formatCurrencyINR(budgetPlan.cost_per_guest)} / guest
              </span>
            </div>

            <div className="guest-stepper-control" role="group" aria-label="Guest count stepper">
              <button
                type="button"
                className="stepper-action-btn"
                onClick={() => handleGuestStep(-25)}
                aria-label="Decrease guest count by 25"
                disabled={stepperGuests <= 10}
              >
                <MinusIcon size={16} />
              </button>

              <input
                id="whatIfGuestInput"
                type="number"
                min={10}
                max={5000}
                step={1}
                value={stepperGuests}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setStepperGuests(Math.max(10, Math.min(5000, val)));
                }}
                className="guest-stepper-input"
                aria-label="Exact guest count"
              />

              <button
                type="button"
                className="stepper-action-btn"
                onClick={() => handleGuestStep(25)}
                aria-label="Increase guest count by 25"
                disabled={stepperGuests >= 5000}
              >
                <PlusIcon size={16} />
              </button>
            </div>
            <div className="stepper-hint">Min 10, max 5,000 guests. Use - / + or type directly.</div>
          </div>

          {/* Priorities Re-weighting */}
          <div className="priorities-simulator-group">
            <span id="priorityToggleLabel" className="simulator-label">
              Dynamic Priority Focus (Select up to 3 to shift budget weights):
            </span>
            <div
              className="priority-chips-row"
              role="group"
              aria-labelledby="priorityToggleLabel"
            >
              {ALL_PRIORITIES.map((p) => {
                const isSelected = selectedPriorities.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`priority-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => handlePriorityToggle(p)}
                    aria-pressed={isSelected}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Category Breakdown Table */}
      <section className="budget-table-section" aria-labelledby="category-breakdown-heading">
        <div className="table-header-bar">
          <div>
            <h3 id="category-breakdown-heading" className="section-title">
              Category Allocation Details
            </h3>
            <p className="section-subtitle">
              Calculated using the Largest Remainder (Hamilton) method. Sums to exactly {formatCurrencyINR(budgetPlan.total_budget)} with 0 rupee rounding errors.
            </p>
          </div>
          {/* Toggle between INR and Percentage */}
          <div className="display-mode-toggle" role="group" aria-label="Display mode toggle">
            <button
              type="button"
              className={`toggle-option ${displayMode === "inr" ? "active" : ""}`}
              onClick={() => setDisplayMode("inr")}
            >
              Rupees (₹)
            </button>
            <button
              type="button"
              className={`toggle-option ${displayMode === "percentage" ? "active" : ""}`}
              onClick={() => setDisplayMode("percentage")}
            >
              Percentage (%)
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="budget-table" aria-label="Wedding budget allocations">
            <thead>
              <tr>
                <th scope="col" style={{ width: "28%" }}>Category</th>
                <th scope="col" style={{ width: "32%" }}>Allocation Distribution</th>
                <th scope="col" style={{ width: "15%", textAlign: "right" }}>Percentage</th>
                <th scope="col" style={{ width: "25%", textAlign: "right" }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {budgetPlan.allocations.map((alloc) => {
                const catColor = CATEGORY_COLORS[alloc.category] || "var(--color-primary)";
                return (
                  <tr key={alloc.category}>
                    <td>
                      <div className="cat-cell-content">
                        <span className="cat-color-swatch" style={{ backgroundColor: catColor }} />
                        <div>
                          <strong className="cat-name">{alloc.category}</strong>
                          <div className="cat-desc">{alloc.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="table-progress-cell">
                        <div className="table-progress-track">
                          <div
                            className="table-progress-fill"
                            style={{
                              width: `${Math.min(100, alloc.percentage * 2.5)}%`,
                              backgroundColor: catColor,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: displayMode === "percentage" ? 700 : 500 }}>
                      <span className={`value-badge ${displayMode === "percentage" ? "highlight" : ""}`}>
                        {formatPercentage(alloc.percentage)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: displayMode === "inr" ? 700 : 500 }}>
                      <span className={`value-badge ${displayMode === "inr" ? "highlight" : ""}`}>
                        {formatCurrencyINR(alloc.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Total Wedding Budget Allocation</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>100.0%</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong style={{ color: "var(--color-primary)" }}>
                    {formatCurrencyINR(budgetPlan.total_budget)}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
};
