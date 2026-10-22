import React from "react";
import {
  BudgetPlan,
  OverviewData,
  TimelinePlan,
  WeddingFunction,
} from "../../types";
import {
  capitalizeCity,
  formatCurrencyCompactINR,
  formatCurrencyINR,
  formatDateReadable,
  formatPercentage,
} from "../../utils/formatters";
import { Badge } from "../common/Badge";
import { Notice } from "../common/Notice";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  InfoIcon,
  RupeeIcon,
  SparklesIcon,
} from "../common/Icons";

interface OverviewTabProps {
  overview: OverviewData;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  functions: WeddingFunction[];
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  disclaimer: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Venue": "#800020",
  "Catering": "#C04000",
  "Decor & Florals": "#D4AF37",
  "Photography & Video": "#2E5B88",
  "Attire & Jewellery": "#8E3B68",
  "Music & Entertainment": "#E07A5F",
  "Invitations & Stationery": "#81B29A",
  "Makeup & Mehendi": "#DDA15E",
  "Logistics, Transport & Stay": "#3D405B",
  "Contingency": "#6C757D",
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  budget,
  timeline,
  functions,
  completedTaskIds,
  onToggleTask,
  disclaimer,
}) => {
  // Pending tasks for "Next 3 Actions"
  const pendingTasks = timeline.tasks.filter((t) => !completedTaskIds.includes(t.id));
  const nextThreeActions = pendingTasks.slice(0, 3);

  // Timeline completion percentage
  const totalTasks = timeline.tasks.length;
  const completedCount = completedTaskIds.length;
  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Donut chart math
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const donutSlices = budget.allocations.map((item) => {
    const sliceLength = (item.percentage / 100) * circumference;
    const strokeDasharray = `${sliceLength} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle;
    accumulatedAngle += sliceLength;
    const color = CATEGORY_COLORS[item.category] || "#999999";

    return {
      category: item.category,
      percentage: item.percentage,
      amount: item.amount,
      color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Typical tier benchmark range
  const tierHealthy = overview.tier_min_healthy || 1800;
  const tierTight = overview.tier_min_tight || 1100;

  return (
    <div className="overview-container">
      {overview.is_tight_timeline && (
        <Notice type="warning" title="Very Tight Timeline In Effect">
          Your wedding is only {overview.days_remaining} days away. High-priority milestones have been compressed for immediate booking.
        </Notice>
      )}

      {/* 4 Key Stat Cards */}
      <section className="overview-stats-grid" aria-label="Key wedding metrics">
        {/* Stat 1: Total Budget */}
        <div className="stat-card">
          <div className="stat-header-row">
            <span className="stat-label">Total Budget</span>
            <span className="stat-compact-tag">{formatCurrencyCompactINR(overview.total_budget)}</span>
          </div>
          <span className="stat-value">{formatCurrencyINR(overview.total_budget)}</span>
          <span className="stat-subtext">
            Allocated across {budget.allocations.length} primary wedding categories
          </span>
        </div>

        {/* Stat 2: Per-Guest Spend with Tier Context */}
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

        {/* Stat 3: Confirmed Functions */}
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

        {/* Stat 4: Countdown & Progress */}
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

      {/* Two Column Layout: Executive Summary & Donut Chart */}
      <div className="overview-main-grid">
        {/* Left Column: Executive Summary & Smart Alerts */}
        <div className="overview-left-col">
          <section className="dashboard-card" aria-labelledby="executive-summary-heading">
            <div className="card-header-row">
              <h2 id="executive-summary-heading" className="card-heading">
                <SparklesIcon size={20} color="var(--color-primary)" />
                Executive Plan Summary
              </h2>
            </div>
            <p className="summary-paragraph">{overview.summary}</p>
          </section>

          {/* Smart Alerts & Suggestions */}
          {(overview.key_warnings.length > 0 || budget.suggestions.length > 0) && (
            <section className="dashboard-card alerts-card" aria-labelledby="smart-alerts-heading">
              <div className="card-header-row">
                <h2 id="smart-alerts-heading" className="card-heading">
                  <AlertTriangleIcon size={20} color="var(--color-accent-gold)" />
                  Smart Planner Alerts & Guidance
                </h2>
              </div>
              {overview.key_warnings.length > 0 && (
                <div className="alerts-group">
                  <h3 className="alerts-subheading">Important Considerations</h3>
                  <ul className="alerts-list">
                    {overview.key_warnings.map((warn, idx) => (
                      <li key={idx} className="alert-item warning">
                        <div className="alert-badge-group">
                          <AlertTriangleIcon size={16} color="currentColor" />
                          <span className="alert-severity-tag">Warning</span>
                        </div>
                        <span className="alert-text">{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {budget.suggestions.length > 0 && (
                <div className="alerts-group" style={{ marginTop: "12px" }}>
                  <h3 className="alerts-subheading">Actionable Optimization Tips</h3>
                  <ul className="alerts-list">
                    {budget.suggestions.map((sug, idx) => (
                      <li key={idx} className="alert-item tip">
                        <div className="alert-badge-group">
                          <InfoIcon size={16} color="currentColor" />
                          <span className="alert-severity-tag">Tip</span>
                        </div>
                        <span className="alert-text">{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Next 3 Immediate Actions */}
          <section className="dashboard-card" aria-labelledby="next-actions-heading">
            <div className="card-header-row">
              <h2 id="next-actions-heading" className="card-heading">
                <CalendarIcon size={20} color="var(--color-primary)" />
                Your Next 3 Immediate Actions
              </h2>
            </div>
            {nextThreeActions.length > 0 ? (
              <ul className="next-actions-list">
                {nextThreeActions.map((task) => (
                  <li key={task.id} className="next-action-item">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={completedTaskIds.includes(task.id)}
                        onChange={() => onToggleTask(task.id)}
                        aria-label={`Mark "${task.title}" as completed`}
                      />
                      <span className="checkbox-custom" />
                    </label>
                    <div className="action-text-content">
                      <div className="action-title-row">
                        <span className="action-title">{task.title}</span>
                        <Badge type="priority" value={task.priority} />
                      </div>
                      <div className="action-meta">
                        <span>Phase: {task.phase}</span>
                        <span>•</span>
                        <span>Due: {formatDateReadable(task.due_date)}</span>
                        {task.is_overdue_standard && (
                          <span className="badge-overdue-standard">Overdue by standard lead time</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="all-caught-up">
                <CheckIcon size={24} color="#15803D" />
                <p>All scheduled milestones are marked complete! Check the Timeline tab for full roadmap details.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: SVG Donut Chart & Progress Ring */}
        <div className="overview-right-col">
          {/* SVG Donut Chart for Budget Split */}
          <section className="dashboard-card donut-chart-card" aria-labelledby="budget-breakdown-heading">
            <h2 id="budget-breakdown-heading" className="card-heading">
              <RupeeIcon size={20} color="var(--color-primary)" />
              Budget Allocation Breakdown
            </h2>

            <div className="donut-wrapper">
              <svg width="220" height="220" viewBox="0 0 220 220" className="donut-svg" role="img" aria-label="Budget allocation chart">
                <g transform="rotate(-90 110 110)">
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.category}
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="28"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="donut-segment"
                    />
                  ))}
                </g>
                <text x="110" y="105" textAnchor="middle" className="donut-center-total">
                  {formatCurrencyCompactINR(overview.total_budget)}
                </text>
                <text x="110" y="125" textAnchor="middle" className="donut-center-sub">
                  Total Budget
                </text>
              </svg>

              {/* Screen reader table */}
              <table className="sr-only">
                <caption>Budget allocation percentages and amounts</caption>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Percentage</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.allocations.map((a) => (
                    <tr key={a.category}>
                      <td>{a.category}</td>
                      <td>{formatPercentage(a.percentage)}</td>
                      <td>{formatCurrencyINR(a.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="donut-legend">
                {donutSlices.map((slice) => (
                  <div key={slice.category} className="legend-row">
                    <span className="legend-dot" style={{ backgroundColor: slice.color }} />
                    <span className="legend-category">{slice.category}</span>
                    <span className="legend-pct">{formatPercentage(slice.percentage)}</span>
                    <span className="legend-amount">{formatCurrencyCompactINR(slice.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Timeline Readiness Progress Ring */}
          <section className="dashboard-card progress-ring-card" aria-labelledby="readiness-heading">
            <h2 id="readiness-heading" className="card-heading">
              <CheckIcon size={20} color="var(--color-primary)" />
              Planning Roadmap Readiness
            </h2>
            <div className="progress-ring-container">
              <svg width="140" height="140" viewBox="0 0 140 140" className="progress-ring-svg" role="img" aria-label={`Readiness: ${completionPct}%`}>
                <circle cx="70" cy="70" r="54" fill="transparent" stroke="var(--color-border)" strokeWidth="12" />
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="transparent"
                  stroke="var(--color-primary)"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - completionPct / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  style={{ transition: "stroke-dashoffset 0.4s ease" }}
                />
                <text x="70" y="68" textAnchor="middle" className="ring-percentage">
                  {completionPct}%
                </text>
                <text x="70" y="85" textAnchor="middle" className="ring-subtext">
                  Complete
                </text>
              </svg>
              <div className="progress-ring-details">
                <span className="progress-count">
                  {completedCount} of {totalTasks} milestones completed
                </span>
                <p className="progress-hint">
                  Check off items in the Timeline and Next Actions to keep your preparation on schedule.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Estimate Disclaimer */}
      <p className="overview-disclaimer">
        {disclaimer}
      </p>
    </div>
  );
};
