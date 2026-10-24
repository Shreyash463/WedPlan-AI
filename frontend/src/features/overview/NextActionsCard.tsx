import React from "react";
import { TimelineTask } from "../../types";
import { formatDateReadable } from "../../utils/formatters";
import { Badge } from "../../components/ui/Badge";
import { CalendarIcon, CheckIcon } from "../../components/common/Icons";

interface NextActionsCardProps {
  nextThreeActions: TimelineTask[];
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
}

export const NextActionsCard: React.FC<NextActionsCardProps> = ({
  nextThreeActions,
  completedTaskIds,
  onToggleTask,
}) => {
  return (
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
  );
};
