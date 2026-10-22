import React from "react";
import { BudgetHealth, TaskPriority } from "../../types";
import { AlertTriangleIcon, CheckIcon, InfoIcon } from "./Icons";

interface BadgeProps {
  type: "health" | "priority" | "status" | "source";
  value: BudgetHealth | TaskPriority | string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  if (type === "health") {
    const health = value as BudgetHealth;
    let badgeClass = "badge-health-healthy";
    let icon = <CheckIcon size={13} color="currentColor" />;

    if (health === "Tight") {
      badgeClass = "badge-health-tight";
      icon = <InfoIcon size={13} color="currentColor" />;
    } else if (health === "Unrealistic") {
      badgeClass = "badge-health-unrealistic";
      icon = <AlertTriangleIcon size={13} color="currentColor" />;
    }

    return (
      <span className={`badge-pill ${badgeClass}`}>
        {icon}
        <span>{health} Budget</span>
      </span>
    );
  }

  if (type === "priority") {
    const priority = value as TaskPriority;
    let badgeClass = "badge-priority-normal";
    if (priority === "Urgent") badgeClass = "badge-priority-urgent";
    else if (priority === "High") badgeClass = "badge-priority-high";

    return (
      <span className={`badge-tag ${badgeClass}`}>
        {priority === "Urgent" && <AlertTriangleIcon size={11} color="currentColor" />}
        {priority}
      </span>
    );
  }

  return (
    <span className="badge-tag badge-generic">
      {value}
    </span>
  );
};
