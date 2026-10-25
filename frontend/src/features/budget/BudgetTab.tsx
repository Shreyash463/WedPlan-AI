import React from "react";
import { BudgetTabProps } from "./types";
import { useWhatIf } from "../../hooks/useWhatIf";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { CategoryTable } from "./CategoryTable";

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
  const {
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
  } = useWhatIf({
    budgetPlan,
    city,
    cityTier,
    weddingDate,
    functions,
    style,
    initialPriorities,
    onBudgetUpdated,
  });

  return (
    <div className="budget-tab-container">
      <WhatIfSimulator
        budgetPlan={budgetPlan}
        originalBudget={originalBudget}
        sliderBudget={sliderBudget}
        setSliderBudget={setSliderBudget}
        exactBudgetString={exactBudgetString}
        setExactBudgetString={setExactBudgetString}
        stepperGuests={stepperGuests}
        setStepperGuests={setStepperGuests}
        guestCountString={guestCountString}
        setGuestCountString={setGuestCountString}
        selectedPriorities={selectedPriorities}
        setSelectedPriorities={setSelectedPriorities}
        isRecalculating={isRecalculating}
      />

      <CategoryTable allocations={budgetPlan.allocations} totalBudget={budgetPlan.total_budget} />
    </div>
  );
};
