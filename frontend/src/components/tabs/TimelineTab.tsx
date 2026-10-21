import React from "react";
import { CANONICAL_PHASES, TimelinePlan, TimelineTask } from "../../types";
import { formatDateReadable } from "../../utils/formatters";
import { Badge } from "../common/Badge";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { AlertTriangleIcon, CalendarIcon, CheckIcon } from "../common/Icons";

interface TimelineTabProps {
  timelinePlan: TimelinePlan;
  completedTasks?: string[];
  onToggleTask?: (taskId: string) => void;
}

export function normalizePhase(phase: string): string {
  if (phase.includes("6+")) return "6+ Months";
  if (phase.includes("5-6")) return "5-6 Months";
  if (phase.includes("3-4")) return "3-4 Months";
  if (phase.includes("2 Month")) return "2 Months";
  if (phase.includes("1 Month")) return "1 Month";
  if (phase.includes("2 Week")) return "2 Weeks";
  if (phase.includes("72 Hour") || phase.includes("72-Hour")) return "Final 72 Hours";
  if (phase.includes("Week")) return "Final Week";
  if (phase.includes("Wedding Day") || phase === "Wedding Day") return "Wedding Day";
  if (phase.includes("After") || phase.includes("Post")) return "After Wedding";
  return phase;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  timelinePlan,
  completedTasks: externalCompletedTasks,
  onToggleTask: externalOnToggleTask,
}) => {
  // Fallback to internal localStorage if not provided via props
  const [internalCompleted, setInternalCompleted] = useLocalStorage<string[]>(
    "wedplan_completed_tasks",
    []
  );

  const completedTasks = externalCompletedTasks ?? internalCompleted;
  const toggleTask =
    externalOnToggleTask ??
    ((taskId: string) => {
      setInternalCompleted((prev) =>
        prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      );
    });

  // Group tasks by normalized canonical phase
  const groupedTasks: Record<string, TimelineTask[]> = {};
  for (const phase of CANONICAL_PHASES) {
    groupedTasks[phase] = [];
  }
  for (const task of timelinePlan.tasks) {
    const norm = normalizePhase(task.phase);
    if (!groupedTasks[norm]) {
      groupedTasks[norm] = [];
    }
    groupedTasks[norm].push(task);
  }

  // Active phases in canonical order
  const activePhases = [
    ...CANONICAL_PHASES.filter((p) => groupedTasks[p] && groupedTasks[p].length > 0),
    ...Object.keys(groupedTasks).filter((p) => !CANONICAL_PHASES.includes(p) && groupedTasks[p].length > 0),
  ];

  const totalTasks = timelinePlan.tasks.length;
  const completedCount = timelinePlan.tasks.filter((t) =>
    completedTasks.includes(t.id)
  ).length;
  const progressPct = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div className="timeline-tab-container">
      {/* Progress Counter Card */}
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

      {/* Vertical Timeline Tree */}
      <div className="timeline-vertical-tree">
        {activePhases.map((phase, pIdx) => {
          const tasksInPhase = groupedTasks[phase] || [];
          const allPhaseTasksDone = tasksInPhase.every((t) => completedTasks.includes(t.id));

          return (
            <section
              key={phase}
              className={`timeline-phase-node ${allPhaseTasksDone ? "phase-completed" : ""}`}
              aria-labelledby={`phase-title-${phase.replace(/[^a-zA-Z0-9]/g, "-")}`}
            >
              {/* Phase Header with Milestone Bullet */}
              <div className="phase-node-header">
                <div className="milestone-bullet-container">
                  <span className={`milestone-bullet ${allPhaseTasksDone ? "done" : ""}`}>
                    {allPhaseTasksDone ? <CheckIcon size={14} color="#FFFFFF" /> : pIdx + 1}
                  </span>
                  <div className="milestone-vertical-line" />
                </div>

                <div className="phase-title-content">
                  <h3
                    id={`phase-title-${phase.replace(/[^a-zA-Z0-9]/g, "-")}`}
                    className="phase-title-text"
                  >
                    {phase}
                  </h3>
                  <span className="phase-tasks-count">
                    {tasksInPhase.length} action{tasksInPhase.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Task Cards in this Phase */}
              <ul className="phase-task-list">
                {tasksInPhase.map((task) => {
                  const isChecked = completedTasks.includes(task.id);
                  const inputId = `checkbox-${task.id}`;

                  return (
                    <li
                      key={task.id}
                      className={`timeline-task-item ${isChecked ? "task-done" : ""}`}
                    >
                      <label htmlFor={inputId} className="task-checkbox-label">
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTask(task.id)}
                          aria-label={`Mark task completed: ${task.title}`}
                        />
                        <span className="task-checkbox-box">
                          {isChecked && <CheckIcon size={12} color="#FFFFFF" />}
                        </span>
                      </label>

                      <div className="task-body">
                        <div className="task-headline">
                          <span className={`task-title-text ${isChecked ? "completed-strike" : ""}`}>
                            {task.title}
                          </span>
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
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};
