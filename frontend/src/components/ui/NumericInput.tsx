import React, { ChangeEvent, FocusEvent, useState } from "react";
import {
  formatDigitsIndianGrouping,
  formatNumberToIndianWords,
  parseNumericDigits,
  sanitizeDigitsOnly,
} from "../../utils/currency";

export interface NumericInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: (val: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  prefix?: string;
  showWordsHelper?: boolean;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  ariaDescribedBy?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  prefix,
  showWordsHelper = true,
  error,
  disabled,
  required,
  ariaDescribedBy,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = sanitizeDigitsOnly(raw, 10);
    onChange(digits);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e.target.value);
  };

  const displayValue = isFocused ? value : formatDigitsIndianGrouping(value);
  const numericVal = parseNumericDigits(value);
  const wordsHelper =
    showWordsHelper && numericVal && numericVal > 0
      ? formatNumberToIndianWords(numericVal)
      : null;

  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy = [
    ariaDescribedBy,
    wordsHelper ? helperId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="numeric-input-wrapper">
      <div className={`input-affix-container ${error ? "has-error" : ""}`}>
        {prefix && (
          <span className="input-prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9,]*"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className="form-control"
          autoComplete="off"
        />
      </div>

      {wordsHelper && (
        <div id={helperId} className="input-words-hint" aria-live="polite">
          ≈ {prefix ? `${prefix} ` : ""}{wordsHelper}
        </div>
      )}

      {error && (
        <div id={errorId} className="input-error-msg" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
