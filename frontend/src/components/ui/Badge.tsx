import React, { ReactNode } from "react";
import { AlertTriangleIcon, CheckIcon, InfoIcon } from "../common/Icons";

export type BadgeVariant = "neutral" | "warning" | "overdue" | "success" | "info" | "royal";

export interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: ReactNode;
  // Backward compatibility with previous type / value props
  type?: "health" | "priority" | "status" | "source";
  value?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", className = "", icon, type, value }) => {
  // Support legacy type/value invocations
  if (type === "health" && value) {
    let badgeClass = "badge-health-healthy";
    let autoIcon = <CheckIcon size={13} color="currentColor" />;
    if (value === "Tight") {
      badgeClass = "badge-health-tight";
      autoIcon = <InfoIcon size={13} color="currentColor" />;
    } else if (value === "Unrealistic") {
      badgeClass = "badge-health-unrealistic";
      autoIcon = <AlertTriangleIcon size={13} color="currentColor" />;
    }
    return (
      <span className={`badge-pill ${badgeClass} ${className}`}>
        {autoIcon}
        <span>{value} Budget</span>
      </span>
    );
  }

  if (type === "priority" && value) {
    let badgeClass = "badge-priority-normal";
    if (value === "Urgent") badgeClass = "badge-priority-urgent";
    else if (value === "High") badgeClass = "badge-priority-high";
    return (
      <span className={`badge-tag ${badgeClass} ${className}`}>
        {value === "Urgent" && <AlertTriangleIcon size={11} color="currentColor" />}
        {value}
      </span>
    );
  }

  const content = children || value;
  return (
    <span className={`badge-pill badge--${variant} ${className}`}>
      {icon}
      <span>{content}</span>
    </span>
  );
};
