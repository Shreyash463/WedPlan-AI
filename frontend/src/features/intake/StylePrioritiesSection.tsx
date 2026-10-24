import React from "react";
import { Priority, WeddingFunction, WeddingStyle } from "../../types";
import { CheckIcon, PlusIcon } from "../../components/common/Icons";
import { ALL_FUNCTIONS, ALL_PRIORITIES, ALL_STYLES } from "./types";

interface StylePrioritiesSectionProps {
  style: WeddingStyle;
  setStyle: (s: WeddingStyle) => void;
  functions: WeddingFunction[];
  toggleFunction: (fn: WeddingFunction) => void;
  priorities: Priority[];
  togglePriority: (p: Priority) => void;
  errors: Record<string, string>;
}

export const StylePrioritiesSection: React.FC<StylePrioritiesSectionProps> = ({
  style,
  setStyle,
  functions,
  toggleFunction,
  priorities,
  togglePriority,
  errors,
}) => {
  return (
    <fieldset className="form-section-fieldset">
      <legend className="section-legend">
        <span className="section-number">3</span>
        <span>Celebration Style & Priorities</span>
      </legend>

      <div className="form-grid">
        <div className="form-group form-group-full">
          <label htmlFor="style" className="form-label">
            Wedding Style / Vibe <span className="required-indicator">*</span>
          </label>
          <select
            id="style"
            className="form-select"
            value={style}
            onChange={(e) => setStyle(e.target.value as WeddingStyle)}
            aria-describedby="style-help"
          >
            {ALL_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span id="style-help" className="field-help">
            Customizes budget weightings, decor aesthetics, and vendor checklists
          </span>
        </div>

        <div className="form-group form-group-full">
          <span id="functions-label" className="form-label">
            Celebrated Functions (Select all that apply) <span className="required-indicator">*</span>
          </span>
          <div
            role="group"
            aria-labelledby="functions-label"
            className="chips-group"
          >
            {ALL_FUNCTIONS.map((fn) => {
              const isSelected = functions.includes(fn);
              return (
                <button
                  key={fn}
                  type="button"
                  className={`chip-btn ${isSelected ? "selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => toggleFunction(fn)}
                >
                  {isSelected ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                  <span>{fn}</span>
                </button>
              );
            })}
          </div>
          {errors.functions && (
            <span id="functions-error" className="field-error" role="alert">
              {errors.functions}
            </span>
          )}
        </div>

        <div className="form-group form-group-full">
          <span id="priorities-label" className="form-label">
            Top Priorities <span className="field-help">(Choose up to 3 to boost budget allocation)</span>
          </span>
          <div
            role="group"
            aria-labelledby="priorities-label"
            className="chips-group"
          >
            {ALL_PRIORITIES.map((p) => {
              const isSelected = priorities.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  className={`chip-btn ${isSelected ? "selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => togglePriority(p)}
                >
                  {isSelected ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                  <span>{p}</span>
                </button>
              );
            })}
          </div>
          <span className="field-help">
            {priorities.length}/3 selected. These categories receive higher percentage shares.
          </span>
        </div>
      </div>
    </fieldset>
  );
};
