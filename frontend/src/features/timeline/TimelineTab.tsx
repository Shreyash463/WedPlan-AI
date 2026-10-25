import React from "react";
import { CANONICAL_PHASES, TimelineTask } from "../../types";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { TimelineTabProps, normalizePhase } from "./types";
import { TimelineProgressHeader } from "./TimelineProgressHeader";
import { PhaseNode } from "./PhaseNode";

export const TimelineTab: React.FC<TimelineTabProps> = ({
  timelinePlan,
  completedTasks: externalCompletedTasks,
  onToggleTask: externalOnToggleTask,
}) => {
  const [internalCompleted, setInternalCompleted] = useLocalStorage<string[]>("wedplan_completed_tasks", []);

  const completedTasks = externalCompletedTasks ?? internalCompleted;
  const toggleTask =
    externalOnToggleTask ??
    ((taskId: string) => {
      setInternalCompleted((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
    });

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

  const activePhases = [
    ...CANONICAL_PHASES.filter((p) => groupedTasks[p] && groupedTasks[p].length > 0),
    ...Object.keys(groupedTasks).filter((p) => !CANONICAL_PHASES.includes(p) && groupedTasks[p].length > 0),
  ];

  const totalTasks = timelinePlan.tasks.length;
  const completedCount = timelinePlan.tasks.filter((t) => completedTasks.includes(t.id)).length;
  const progressPct = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div className="timeline-tab-container">
      <TimelineProgressHeader completedCount={completedCount} totalTasks={totalTasks} progressPct={progressPct} />

      <div className="timeline-vertical-tree">
        {activePhases.map((phase, pIdx) => (
          <PhaseNode
            key={phase}
            phase={phase}
            pIdx={pIdx}
            tasksInPhase={groupedTasks[phase] || []}
            completedTasks={completedTasks}
            toggleTask={toggleTask}
          />
        ))}
      </div>
    </div>
  );
};
