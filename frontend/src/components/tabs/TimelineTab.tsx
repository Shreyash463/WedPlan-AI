import React from "react";
import { TimelinePlan, TimelineTask } from "../../types";
import { formatDateReadable } from "../../utils/formatters";
import { Badge } from "../common/Badge";
import { useLocalStorage } from "../../hooks/useLocalStorage";

interface TimelineTabProps {
  timelinePlan: TimelinePlan;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ timelinePlan }) => {
  // Persist completed task IDs in localStorage
  const [completedTasks, setCompletedTasks] = useLocalStorage<string[]>(
    "wedplan_completed_tasks",
    []
  );

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Group tasks by phase
  const groupedTasks: Record<string, TimelineTask[]> = {};
  for (const phase of timelinePlan.phases) {
    groupedTasks[phase] = [];
  }
  for (const task of timelinePlan.tasks) {
    if (!groupedTasks[task.phase]) {
      groupedTasks[task.phase] = [];
    }
    groupedTasks[task.phase].push(task);
  }

  const totalTasks = timelinePlan.tasks.length;
  const completedCount = timelinePlan.tasks.filter((t) =>
    completedTasks.includes(t.id)
  ).length;
  const progressPct = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div className="timeline-tab-container">
      {/* Progress Counter Card */}
      <div
        style={{
          background: "var(--color-surface-subtle)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-md) var(--space-lg)",
          marginBottom: "var(--space-xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <strong style={{ fontSize: "1.1rem", color: "var(--color-primary)" }}>
            Preparation Progress
          </strong>
          <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {completedCount} of {totalTasks} checklist items completed
          </div>
        </div>
        <div style={{ minWidth: "180px" }}>
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
                background: "var(--color-healthy)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Grouped Phase Roadmaps */}
      {timelinePlan.phases.map((phase) => {
        const tasksInPhase = groupedTasks[phase] || [];
        if (tasksInPhase.length === 0) return null;

        return (
          <section
            key={phase}
            className="timeline-phase-group"
            aria-labelledby={`phase-title-${phase.replace(/\s+/g, "-")}`}
          >
            <div className="phase-header">
              <h2
                id={`phase-title-${phase.replace(/\s+/g, "-")}`}
                style={{ fontSize: "1.2rem", color: "var(--color-primary)" }}
              >
                {phase}
              </h2>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                }}
              >
                {tasksInPhase.length} tasks
              </span>
            </div>

            <ul className="tasks-list">
              {tasksInPhase.map((task) => {
                const isChecked = completedTasks.includes(task.id);
                const inputId = `checkbox-${task.id}`;

                return (
                  <li
                    key={task.id}
                    className={`task-card ${isChecked ? "completed" : ""}`}
                  >
                    <div className="task-checkbox-wrapper">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTask(task.id)}
                        className="task-checkbox"
                        aria-label={`Mark task completed: ${task.title}`}
                      />
                    </div>
                    <div className="task-body">
                      <div className="task-header-row">
                        <label
                          htmlFor={inputId}
                          className="task-title"
                          style={{ cursor: "pointer" }}
                        >
                          {task.title}
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Badge type="priority" value={task.priority} />
                          <span className="task-due">
                            Due: {formatDateReadable(task.due_date)}
                          </span>
                        </div>
                      </div>
                      <p className="task-desc">{task.description}</p>
                      {task.related_vendor_category && (
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "0.8rem",
                            color: "var(--color-primary)",
                            fontWeight: 600,
                          }}
                        >
                          Linked Category: {task.related_vendor_category}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
