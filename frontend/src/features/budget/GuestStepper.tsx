import React from "react";
import { formatCurrencyINR, parseNumericDigits, sanitizeDigitsOnly } from "../../utils/formatters";
import { MinusIcon, PlusIcon, UsersIcon } from "../../components/common/Icons";

interface GuestStepperProps {
  stepperGuests: number;
  setStepperGuests: (g: number) => void;
  guestCountString: string;
  setGuestCountString: (s: string) => void;
  costPerGuest: number;
}

export const GuestStepper: React.FC<GuestStepperProps> = ({
  stepperGuests,
  setStepperGuests,
  guestCountString,
  setGuestCountString,
  costPerGuest,
}) => {
  const handleGuestStep = (delta: number) => {
    const nextVal = Math.max(10, Math.min(5000, stepperGuests + delta));
    setStepperGuests(nextVal);
    setGuestCountString(String(nextVal));
  };

  const handleGuestInputBlur = () => {
    const parsed = parseNumericDigits(guestCountString);
    if (parsed === null || parsed < 10) {
      setStepperGuests(10);
      setGuestCountString("10");
    } else if (parsed > 5000) {
      setStepperGuests(5000);
      setGuestCountString("5000");
    } else {
      setStepperGuests(parsed);
      setGuestCountString(String(parsed));
    }
  };

  return (
    <div className="simulator-field-group">
      <div className="field-label-row">
        <label htmlFor="whatIfGuestInput" className="simulator-label">
          <UsersIcon size={16} /> Guest Count: <span className="stepper-val-text">{stepperGuests}</span>
        </label>
        <span className="per-guest-calc">{formatCurrencyINR(costPerGuest)} / guest</span>
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
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={guestCountString}
          onChange={(e) => {
            const digits = sanitizeDigitsOnly(e.target.value, 4);
            setGuestCountString(digits);
            const parsed = parseNumericDigits(digits);
            if (parsed !== null && parsed >= 10 && parsed <= 5000) setStepperGuests(parsed);
          }}
          onBlur={handleGuestInputBlur}
          className="guest-stepper-input"
          aria-label="Exact guest count"
          autoComplete="off"
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
  );
};
