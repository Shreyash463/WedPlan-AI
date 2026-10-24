import React from "react";
import { CalendarIcon } from "../../components/common/Icons";

interface TimelineProgressHeaderProps {
  completedCount: number;
  totalTasks: number;
  progressPct: number;
}

export const TimelineProgressHeader: React.FC<TimelineProgressHeaderProps> = ({
  completedCount,
  totalTasks,
  progressPct,
}) => {
  return (
    <section className="timeline-progress-header" aria-labelledby="progress-counter-heading">
      <div className="progress-info-col">
        <h2 id="progress-counter-heading" className="progress-counter-title">
          <CalendarIcon size={20} color="var(--color-primary)" /> Wedding Countdown Roadmap
        </h2>
        <div className="progress-counter-sub">
          {completedCount} of {totalTasks} milestones completed ({Math.round(progressPct)}%)
        </div>
      </div>
      <div className="progress-bar-col">
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Preparation progress: ${Math.round(progressPct)}%`}
        >
          <div
            className="progress-fill"
            style={{
              width: `${progressPct}%`,
              background: "var(--color-primary)",
            }}
          />
        </div>
      </div>
    </section>
  );
};
