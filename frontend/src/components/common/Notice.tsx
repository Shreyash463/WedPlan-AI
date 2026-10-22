import React from "react";
import { AlertTriangleIcon, InfoIcon } from "./Icons";

interface NoticeProps {
  type?: "info" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
}

export const Notice: React.FC<NoticeProps> = ({ type = "warning", title, children }) => {
  const severityLabel = type === "error" ? "Critical" : type === "info" ? "Tip" : "Warning";
  const icon =
    type === "error" ? (
      <AlertTriangleIcon size={18} color="currentColor" />
    ) : type === "info" ? (
      <InfoIcon size={18} color="currentColor" />
    ) : (
      <AlertTriangleIcon size={18} color="currentColor" />
    );

  return (
    <div
      className={`notice-box notice-${type}`}
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
