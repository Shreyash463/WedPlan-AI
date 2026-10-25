import React from "react";
import { formatCurrencyINR } from "../../utils/currency";

interface BudgetGuestsSectionProps {
  budgetString: string;
  onBudgetChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBudgetBlur: () => void;
  guestsString: string;
  onGuestsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGuestsBlur: () => void;
  numericBudget: number | null;
  numericGuests: number | null;
  livePerGuest: number | null;
  inWords: string | null;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
}

export const BudgetGuestsSection: React.FC<BudgetGuestsSectionProps> = ({
  budgetString,
  onBudgetChange,
  onBudgetBlur,
  guestsString,
  onGuestsChange,
  onGuestsBlur,
  numericBudget,
  livePerGuest,
  inWords,
  touched,
  errors,
}) => {
  return (
    <fieldset className="form-section-fieldset">
      <legend className="section-legend">
        <span className="section-number">2</span>
        <span>Budget & Guest Scale</span>
      </legend>

      <div className="form-grid">
        <div className="form-group">
          <div className="label-with-preview">
            <label htmlFor="totalBudget" className="form-label">
              Total Budget (INR) <span className="required-indicator">*</span>
            </label>
            <span className="live-words-pill" aria-live="polite">
              {numericBudget !== null && inWords ? `${formatCurrencyINR(numericBudget)} (${inWords})` : "—"}
            </span>
          </div>
          <input
            id="totalBudget"
            type="text"
            inputMode="numeric"
            pattern="[0-9,]*"
            required
            className="form-input"
            value={budgetString}
            onChange={onBudgetChange}
            onBlur={onBudgetBlur}
            placeholder="e.g. 25,00,000"
            aria-invalid={!!(touched.totalBudget && errors.totalBudget)}
            aria-describedby={errors.totalBudget ? "totalBudget-error" : "totalBudget-help"}
            autoComplete="off"
          />
          {touched.totalBudget && errors.totalBudget ? (
            <span id="totalBudget-error" className="field-error" role="alert" aria-live="polite">
              {errors.totalBudget}
            </span>
          ) : (
            <span id="totalBudget-help" className="field-help">
              Range: ₹50,000 to ₹10,00,00,000 (10 Cr)
            </span>
          )}
        </div>

        <div className="form-group">
          <div className="label-with-preview">
            <label htmlFor="guestCount" className="form-label">
              Guest Count <span className="required-indicator">*</span>
            </label>
            <span className="live-words-pill" aria-live="polite">
              {livePerGuest !== null ? `Est. ${formatCurrencyINR(livePerGuest)} / guest` : "—"}
            </span>
          </div>
          <input
            id="guestCount"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            className="form-input"
            value={guestsString}
            onChange={onGuestsChange}
            onBlur={onGuestsBlur}
            placeholder="e.g. 350"
            aria-invalid={!!(touched.guestCount && errors.guestCount)}
            aria-describedby={errors.guestCount ? "guestCount-error" : "guestCount-help"}
            autoComplete="off"
          />
          {touched.guestCount && errors.guestCount ? (
            <span id="guestCount-error" className="field-error" role="alert" aria-live="polite">
              {errors.guestCount}
            </span>
          ) : (
            <span id="guestCount-help" className="field-help">
              Between 10 and 5,000 attendees
            </span>
          )}
        </div>
      </div>
    </fieldset>
  );
};
