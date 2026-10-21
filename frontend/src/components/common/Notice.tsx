import React from "react";

interface NoticeProps {
  type?: "info" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
}

export const Notice: React.FC<NoticeProps> = ({ type = "warning", title, children }) => {
  return (
    <div
      className="notice-box"
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
      style={{
        backgroundColor:
          type === "error"
            ? "var(--color-unrealistic-bg)"
            : type === "info"
            ? "#EFF6FF"
            : "var(--color-tight-bg)",
        borderColor:
          type === "error"
            ? "var(--color-unrealistic)"
            : type === "info"
            ? "#60A5FA"
            : "#F59E0B",
        color:
          type === "error"
            ? "var(--color-unrealistic)"
            : type === "info"
            ? "#1E40AF"
            : "#78350F",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "1.2rem", lineHeight: 1 }}>
        {type === "error" ? "⚠" : type === "info" ? "ℹ" : "⚡"}
      </span>
      <div>
        {title && <div style={{ fontWeight: 700, marginBottom: "2px" }}>{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
};
