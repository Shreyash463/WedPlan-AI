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
    let bg = "var(--color-healthy-bg)";
    let color = "var(--color-healthy)";
    let icon = <CheckIcon size={13} color="currentColor" />;

    if (health === "Tight") {
      bg = "var(--color-tight-bg)";
      color = "var(--color-tight)";
      icon = <InfoIcon size={13} color="currentColor" />;
    } else if (health === "Unrealistic") {
      bg = "var(--color-unrealistic-bg)";
      color = "var(--color-unrealistic)";
      icon = <AlertTriangleIcon size={13} color="currentColor" />;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "9999px",
          fontSize: "0.825rem",
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${color}`,
        }}
      >
        {icon}
        <span>{health} Budget</span>
      </span>
    );
  }

  if (type === "priority") {
    const priority = value as TaskPriority;
    let bg = "var(--color-surface-subtle)";
    let color = "var(--color-text-muted)";

    if (priority === "Urgent") {
      bg = "rgba(155, 27, 48, 0.12)";
      color = "var(--color-primary)";
    } else if (priority === "High") {
      bg = "rgba(217, 119, 6, 0.12)";
      color = "#B45309";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
        }}
      >
        {priority === "Urgent" && <AlertTriangleIcon size={11} color="currentColor" />}
        {priority}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: "var(--color-surface-subtle)",
        color: "var(--color-text-main)",
        border: "1px solid var(--color-border)",
      }}
    >
      {value}
    </span>
  );
};
