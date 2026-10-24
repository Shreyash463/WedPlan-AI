import React from "react";
import { CheckIcon } from "../../components/common/Icons";

interface ReadinessCardProps {
  completedCount: number;
  totalTasks: number;
  completionPct: number;
}

export const ReadinessCard: React.FC<ReadinessCardProps> = ({
  completedCount,
  totalTasks,
  completionPct,
}) => {
  return (
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
  );
};
