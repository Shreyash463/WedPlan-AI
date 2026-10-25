import React from "react";
import { Priority } from "../../types";
import { ALL_PRIORITIES } from "./types";

interface PriorityChipsProps {
  selectedPriorities: Priority[];
  setSelectedPriorities: React.Dispatch<React.SetStateAction<Priority[]>>;
}

export const PriorityChips: React.FC<PriorityChipsProps> = ({ selectedPriorities, setSelectedPriorities }) => {
  const handlePriorityToggle = (p: Priority) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((item) => item !== p);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

  return (
    <div className="priorities-simulator-group">
      <span id="priorityToggleLabel" className="simulator-label">
        Dynamic Priority Focus (Select up to 3 to shift budget weights):
      </span>
      <div className="priority-chips-row" role="group" aria-labelledby="priorityToggleLabel">
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
  );
};
