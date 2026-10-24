import { useState, useEffect, useRef } from "react";
import { BudgetPlan, CityTier, Priority, WeddingFunction, WeddingStyle } from "../types";
import { recalculatePlan } from "../api/client";
import { formatDigitsIndianGrouping, parseNumericDigits } from "../utils/currency";

export const MIN_BUDGET = 50_000;
export const MAX_BUDGET = 100_000_000;
export const LOG_MIN = Math.log(MIN_BUDGET);
export const LOG_MAX = Math.log(MAX_BUDGET);

export function budgetToSlider(b: number): number {
  const clamped = Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, b));
  return Math.round(((Math.log(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);
}

export function sliderToBudget(val: number): number {
  const b = Math.exp(LOG_MIN + (val / 1000) * (LOG_MAX - LOG_MIN));
  if (b < 1_000_000) return Math.round(b / 10_000) * 10_000;
  if (b < 10_000_000) return Math.round(b / 50_000) * 50_000;
  return Math.round(b / 100_000) * 100_000;
}

export interface UseWhatIfParams {
  budgetPlan: BudgetPlan;
  city: string;
  cityTier: CityTier;
  weddingDate: string;
  functions: WeddingFunction[];
  style: WeddingStyle;
  initialPriorities: Priority[];
  onBudgetUpdated: (updatedPlan: BudgetPlan) => void;
}

export function useWhatIf({
  budgetPlan,
  city,
  cityTier,
  weddingDate,
  functions,
  style,
  initialPriorities,
  onBudgetUpdated,
}: UseWhatIfParams) {
  const [sliderBudget, setSliderBudget] = useState<number>(budgetPlan.total_budget);
  const [exactBudgetString, setExactBudgetString] = useState<string>(
    formatDigitsIndianGrouping(String(budgetPlan.total_budget))
  );
  const [stepperGuests, setStepperGuests] = useState<number>(budgetPlan.guest_count);
  const [guestCountString, setGuestCountString] = useState<string>(
    String(budgetPlan.guest_count)
  );
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>(initialPriorities);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSliderBudget(budgetPlan.total_budget);
    setExactBudgetString(formatDigitsIndianGrouping(String(budgetPlan.total_budget)));
    setStepperGuests(budgetPlan.guest_count);
    setGuestCountString(String(budgetPlan.guest_count));
  }, [budgetPlan.total_budget, budgetPlan.guest_count]);

  useEffect(() => {
    const isUnchanged =
      sliderBudget === budgetPlan.total_budget &&
      stepperGuests === budgetPlan.guest_count &&
      JSON.stringify(selectedPriorities) === JSON.stringify(initialPriorities);

    if (isUnchanged) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsRecalculating(true);
      try {
        const response = await recalculatePlan(
          {
            city,
            city_tier: cityTier,
            wedding_date: weddingDate,
            total_budget: sliderBudget,
            guest_count: stepperGuests,
            functions,
            style,
            priorities: selectedPriorities,
          },
          controller.signal
        );
        onBudgetUpdated(response.budget);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Failed to recalculate budget:", err);
        }
      } finally {
        setIsRecalculating(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    sliderBudget,
    stepperGuests,
    selectedPriorities,
    city,
    cityTier,
    weddingDate,
    functions,
    style,
    budgetPlan.total_budget,
    budgetPlan.guest_count,
    initialPriorities,
    onBudgetUpdated,
  ]);

  const handleBudgetChange = (valStr: string) => {
    setExactBudgetString(valStr);
    const parsed = parseNumericDigits(valStr);
    if (parsed !== null && parsed >= MIN_BUDGET && parsed <= MAX_BUDGET) {
      setSliderBudget(parsed);
    }
  };

  const handleGuestChange = (valStr: string) => {
    setGuestCountString(valStr);
    const parsed = parseNumericDigits(valStr);
    if (parsed !== null && parsed >= 10 && parsed <= 5000) {
      setStepperGuests(parsed);
    }
  };

  return {
    sliderBudget,
    setSliderBudget,
    exactBudgetString,
    setExactBudgetString,
    handleBudgetChange,
    stepperGuests,
    setStepperGuests,
    guestCountString,
    setGuestCountString,
    handleGuestChange,
    selectedPriorities,
    setSelectedPriorities,
    isRecalculating,
  };
}
