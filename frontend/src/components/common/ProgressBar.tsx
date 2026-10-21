import React from "react";

interface ProgressBarProps {
  percentage: number;
  label?: string;
  amountText?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  amountText,
  color,
}) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {(label || amountText) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {label && <span>{label}</span>}
          {amountText && <span>{amountText} ({percentage.toFixed(1)}%)</span>}
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(clampedPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label} allocation: ${percentage.toFixed(1)}%` : `Allocation ${percentage.toFixed(1)}%`}
      >
        <div
          className="progress-fill"
          style={{
            width: `${clampedPct}%`,
            background: color ? color : undefined,
          }}
        />
      </div>
    </div>
  );
};
