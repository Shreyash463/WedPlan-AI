import React from "react";
import { BudgetPlan, Priority } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { BudgetSliderSync } from "./BudgetSliderSync";
import { GuestStepper } from "./GuestStepper";
import { PriorityChips } from "./PriorityChips";

interface WhatIfSimulatorProps {
  budgetPlan: BudgetPlan;
  originalBudget?: number;
  sliderBudget: number;
  setSliderBudget: (b: number) => void;
  exactBudgetString: string;
  setExactBudgetString: (s: string) => void;
  stepperGuests: number;
  setStepperGuests: (g: number) => void;
  guestCountString: string;
  setGuestCountString: (s: string) => void;
  selectedPriorities: Priority[];
  setSelectedPriorities: React.Dispatch<React.SetStateAction<Priority[]>>;
  isRecalculating: boolean;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  budgetPlan,
  originalBudget,
  sliderBudget,
  setSliderBudget,
  exactBudgetString,
  setExactBudgetString,
  stepperGuests,
  setStepperGuests,
  guestCountString,
  setGuestCountString,
  selectedPriorities,
  setSelectedPriorities,
  isRecalculating,
}) => {
  const baseBudget = originalBudget ?? budgetPlan.total_budget;
  const budgetDelta = sliderBudget - baseBudget;

  return (
    <section className="what-if-panel" aria-labelledby="what-if-heading">
      <div className="what-if-header">
        <div>
          <h2 id="what-if-heading" className="what-if-title">
            Instant What-If Budget Simulator
          </h2>
          <p className="what-if-subtitle">
            Adjust budget, guest count, or priorities to immediately test feasibility. Pure instant calculation, zero AI
            latency.
          </p>
        </div>
        <div className="what-if-status-badges">
          {isRecalculating && <span className="recalculating-pill">Recomputing...</span>}
          <Badge type="health" value={budgetPlan.health_status} />
        </div>
      </div>

      <div className="what-if-grid">
        <BudgetSliderSync
          sliderBudget={sliderBudget}
          setSliderBudget={setSliderBudget}
          exactBudgetString={exactBudgetString}
          setExactBudgetString={setExactBudgetString}
          budgetDelta={budgetDelta}
        />

        <GuestStepper
          stepperGuests={stepperGuests}
          setStepperGuests={setStepperGuests}
          guestCountString={guestCountString}
          setGuestCountString={setGuestCountString}
          costPerGuest={budgetPlan.cost_per_guest}
        />

        <PriorityChips selectedPriorities={selectedPriorities} setSelectedPriorities={setSelectedPriorities} />
      </div>
    </section>
  );
};
