import React from "react";
import { BudgetHealth, TaskPriority } from "../../types";

interface BadgeProps {
  type: "health" | "priority" | "status" | "source";
  value: BudgetHealth | TaskPriority | string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  if (type === "health") {
    const health = value as BudgetHealth;
    let bg = "var(--color-healthy-bg)";
    let color = "var(--color-healthy)";
    let icon = "✓";

    if (health === "Tight") {
      bg = "var(--color-tight-bg)";
      color = "var(--color-tight)";
      icon = "!";
    } else if (health === "Unrealistic") {
      bg = "var(--color-unrealistic-bg)";
      color = "var(--color-unrealistic)";
      icon = "⚠";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 10px",
          borderRadius: "9999px",
          fontSize: "0.875rem",
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${color}`,
        }}
      >
        <span aria-hidden="true">{icon}</span>
        <span>{health} Budget</span>
      </span>
    );
  }

  if (type === "priority") {
    const priority = value as TaskPriority;
    let bg = "#F3F4F6";
    let color = "#374151";

    if (priority === "Urgent") {
      bg = "#FEE2E2";
      color = "#991B1B";
    } else if (priority === "High") {
      bg = "#FEF3C7";
      color = "#92400E";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
        }}
      >
        {priority === "Urgent" && <span aria-hidden="true">⚡ </span>}
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
