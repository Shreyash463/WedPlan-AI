import React from "react";
import { OverviewData } from "../../types";
import { formatCurrencyINR, formatDateReadable } from "../../utils/formatters";
import { Badge } from "../common/Badge";
import { Notice } from "../common/Notice";

interface OverviewTabProps {
  overview: OverviewData;
  disclaimer: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  disclaimer,
}) => {
  return (
    <div className="overview-container">
      {overview.is_tight_timeline && (
        <Notice
          type="warning"
          title="Tight Timeline In Effect"
        >
          Your wedding is only {overview.days_remaining} days away. High-priority
          tasks have been scheduled for immediate action in the Timeline tab.
        </Notice>
      )}

      {/* High Level Key Metrics Cards */}
      <div className="overview-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Planned Budget</span>
          <span className="stat-value">
            {formatCurrencyINR(overview.total_budget)}
          </span>
          <span className="stat-label">
            {overview.guest_count} Confirmed Guests
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Budget Health</span>
          <div style={{ marginTop: "4px" }}>
            <Badge type="health" value={overview.health_status} />
          </div>
          <span className="stat-label" style={{ marginTop: "4px" }}>
            Tier: {overview.city_tier}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Spend Per Guest</span>
          <span className="stat-value">
            {formatCurrencyINR(overview.cost_per_guest)}
          </span>
          <span className="stat-label">Hospitality Benchmark</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Countdown</span>
          <span className="stat-value">
            {overview.days_remaining > 0 ? `${overview.days_remaining} Days` : "Today"}
          </span>
          <span className="stat-label">
            {formatDateReadable(overview.wedding_date)}
          </span>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="overview-summary-box">
        <h2 style={{ fontSize: "1.15rem", marginBottom: "8px", color: "var(--color-primary)" }}>
          Executive Plan Summary
        </h2>
        <p>{overview.summary}</p>
      </div>

      {/* Key Warnings if any */}
      {overview.key_warnings && overview.key_warnings.length > 0 && (
        <div className="warnings-box">
          <h3>
            <span aria-hidden="true">⚠️</span> Important Planner Considerations
          </h3>
          <ul className="warnings-list">
            {overview.key_warnings.map((warn, idx) => (
              <li key={idx} className="warning-item">
                <span aria-hidden="true">•</span>
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
        {disclaimer}
      </p>
    </div>
  );
};
