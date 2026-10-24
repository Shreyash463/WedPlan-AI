import React from "react";
import {
  formatCurrencyCompactINR,
  formatDigitsIndianGrouping,
  parseNumericDigits,
  sanitizeDigitsOnly,
} from "../../utils/formatters";
import { RupeeIcon } from "../../components/common/Icons";
import {
  MIN_BUDGET,
  MAX_BUDGET,
  budgetToSlider,
  sliderToBudget,
} from "../../hooks/useWhatIf";

interface BudgetSliderSyncProps {
  sliderBudget: number;
  setSliderBudget: (b: number) => void;
  exactBudgetString: string;
  setExactBudgetString: (s: string) => void;
  budgetDelta: number;
}

export const BudgetSliderSync: React.FC<BudgetSliderSyncProps> = ({
  sliderBudget,
  setSliderBudget,
  exactBudgetString,
  setExactBudgetString,
  budgetDelta,
}) => {
  const handleExactBudgetBlur = () => {
    const parsed = parseNumericDigits(exactBudgetString);
    if (parsed === null || parsed < MIN_BUDGET) {
      setSliderBudget(MIN_BUDGET);
      setExactBudgetString(formatDigitsIndianGrouping(String(MIN_BUDGET)));
    } else if (parsed > MAX_BUDGET) {
      setSliderBudget(MAX_BUDGET);
      setExactBudgetString(formatDigitsIndianGrouping(String(MAX_BUDGET)));
    } else {
      setSliderBudget(parsed);
      setExactBudgetString(formatDigitsIndianGrouping(String(parsed)));
    }
  };

  return (
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
            onChange={(e) => {
              const b = sliderToBudget(Number(e.target.value));
              setSliderBudget(b);
              setExactBudgetString(formatDigitsIndianGrouping(String(b)));
            }}
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
          <label htmlFor="exactBudgetInput" className="sr-only">Type exact budget amount in INR</label>
          <div className="rupee-input-prefix">₹</div>
          <input
            id="exactBudgetInput"
            type="text"
            inputMode="numeric"
            pattern="[0-9,]*"
            value={exactBudgetString}
            onChange={(e) => {
              const digits = sanitizeDigitsOnly(e.target.value, 10);
              setExactBudgetString(digits);
              const parsed = parseNumericDigits(digits);
              if (parsed !== null && parsed >= MIN_BUDGET && parsed <= MAX_BUDGET) setSliderBudget(parsed);
            }}
            onBlur={handleExactBudgetBlur}
            className="exact-budget-input"
            aria-label="Type exact budget in INR"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};
