import React, { ReactNode } from "react";
import { AlertTriangleIcon, CheckIcon, InfoIcon } from "../common/Icons";

export interface AlertProps {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "warning",
  title,
  children,
  className = "",
}) => {
  const severityLabel =
    type === "error"
      ? "Critical"
      : type === "info"
      ? "Tip"
      : type === "success"
      ? "Success"
      : "Warning";

  const icon =
    type === "error" || type === "warning" ? (
      <AlertTriangleIcon size={18} color="currentColor" />
    ) : type === "success" ? (
      <CheckIcon size={18} color="currentColor" />
    ) : (
      <InfoIcon size={18} color="currentColor" />
    );

  return (
    <div
      className={`notice-box notice-${type} ${className}`}
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="notice-icon-badge">
        {icon}
        <span className="notice-severity-label">{severityLabel}</span>
      </div>
      <div className="notice-content">
        {title && <div className="notice-title">{title}</div>}
        <div className="notice-body">{children}</div>
      </div>
    </div>
  );
};
