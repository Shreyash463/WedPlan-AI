import React from "react";
import { TimelineTask } from "../../types";
import { formatDateReadable } from "../../utils/formatters";
import { Badge } from "../../components/ui/Badge";
import { AlertTriangleIcon, CheckIcon } from "../../components/common/Icons";

interface TaskItemProps {
  task: TimelineTask;
  isChecked: boolean;
  onToggle: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isChecked, onToggle }) => {
  const inputId = `checkbox-${task.id}`;

  return (
    <li className={`timeline-task-item ${isChecked ? "task-done" : ""}`}>
      <label htmlFor={inputId} className="task-checkbox-label">
        <input
          id={inputId}
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggle(task.id)}
          aria-label={`Mark task completed: ${task.title}`}
        />
        <span className="task-checkbox-box">{isChecked && <CheckIcon size={12} color="#FFFFFF" />}</span>
      </label>

      <div className="task-body">
        <div className="task-headline">
          <span className={`task-title-text ${isChecked ? "completed-strike" : ""}`}>{task.title}</span>
          <div className="task-badges">
            {task.is_overdue_standard && (
              <span className="overdue-amber-chip" title="Overdue based on standard Indian wedding booking lead times">
                <AlertTriangleIcon size={12} color="#92400E" /> Overdue by standard lead time
              </span>
            )}
            <Badge type="priority" value={task.priority} />
          </div>
        </div>

        <div className="task-details-row">
          <span className="task-due-date">
            <strong>Target Date:</strong> {formatDateReadable(task.due_date)}
          </span>
          {task.related_vendor_category && (
            <span className="task-vendor-link">
              <strong>Vendor:</strong> {task.related_vendor_category}
            </span>
          )}
        </div>

        <p className="task-description-text">{task.description}</p>
      </div>
    </li>
  );
};
