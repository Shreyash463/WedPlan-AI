import React from "react";
import { OverviewData, WeddingFunction } from "../../types";
import {
  capitalizeCity,
  formatCurrencyCompactINR,
  formatCurrencyINR,
  formatDateReadable,
} from "../../utils/formatters";
import { Badge } from "../../components/ui/Badge";
import { ClockIcon } from "../../components/common/Icons";

interface SummaryMetricsProps {
  overview: OverviewData;
  functions: WeddingFunction[];
  allocationsCount: number;
  completedCount: number;
  totalTasks: number;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  overview,
  functions,
  allocationsCount,
  completedCount,
  totalTasks,
}) => {
  const tierHealthy = overview.tier_min_healthy || 1800;
  const tierTight = overview.tier_min_tight || 1100;

  return (
    <section className="overview-stats-grid" aria-label="Key wedding metrics">
      <div className="stat-card">
        <div className="stat-header-row">
          <span className="stat-label">Total Budget</span>
          <span className="stat-compact-tag">{formatCurrencyCompactINR(overview.total_budget)}</span>
        </div>
        <span className="stat-value">{formatCurrencyINR(overview.total_budget)}</span>
        <span className="stat-subtext">
          Allocated across {allocationsCount} primary wedding categories
        </span>
      </div>

      <div className="stat-card">
        <div className="stat-header-row">
          <span className="stat-label">Per-Guest Spend</span>
          <Badge type="health" value={overview.health_status} />
        </div>
        <span className="stat-value">{formatCurrencyINR(overview.cost_per_guest)}</span>
        <span className="stat-subtext">
          Typical {overview.city_tier} range: {formatCurrencyINR(tierTight)} to {formatCurrencyINR(tierHealthy)}
        </span>
      </div>

      <div className="stat-card">
        <div className="stat-header-row">
          <span className="stat-label">Celebration Functions</span>
          <span className="stat-compact-tag">{functions.length} Events</span>
        </div>
        <div className="function-chips-preview">
          {functions.map((fn) => (
            <span key={fn} className="mini-chip">{fn}</span>
          ))}
        </div>
        <span className="stat-subtext">For {overview.guest_count} invited guests in {capitalizeCity(overview.city)}</span>
      </div>

      <div className="stat-card">
        <div className="stat-header-row">
          <span className="stat-label">Wedding Countdown</span>
          <ClockIcon size={18} color="var(--color-primary)" />
        </div>
        <span className="stat-value">
          {overview.days_remaining > 0 ? `${overview.days_remaining} Days` : "Wedding Day!"}
        </span>
        <span className="stat-subtext">
          {formatDateReadable(overview.wedding_date)} ({completedCount}/{totalTasks} tasks done)
        </span>
      </div>
    </section>
  );
};
