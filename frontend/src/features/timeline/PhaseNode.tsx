import React from "react";
import { TimelineTask } from "../../types";
import { CheckIcon } from "../../components/common/Icons";
import { TaskItem } from "./TaskItem";

interface PhaseNodeProps {
  phase: string;
  pIdx: number;
  tasksInPhase: TimelineTask[];
  completedTasks: string[];
  toggleTask: (taskId: string) => void;
}

export const PhaseNode: React.FC<PhaseNodeProps> = ({ phase, pIdx, tasksInPhase, completedTasks, toggleTask }) => {
  const allPhaseTasksDone = tasksInPhase.every((t) => completedTasks.includes(t.id));

  return (
    <section
      className={`timeline-phase-node ${allPhaseTasksDone ? "phase-completed" : ""}`}
      aria-labelledby={`phase-title-${phase.replace(/[^a-zA-Z0-9]/g, "-")}`}
    >
      <div className="phase-node-header">
        <div className="milestone-bullet-container">
          <span className={`milestone-bullet ${allPhaseTasksDone ? "done" : ""}`}>
            {allPhaseTasksDone ? <CheckIcon size={14} color="#FFFFFF" /> : pIdx + 1}
          </span>
          <div className="milestone-vertical-line" />
        </div>

        <div className="phase-title-content">
          <h3 id={`phase-title-${phase.replace(/[^a-zA-Z0-9]/g, "-")}`} className="phase-title-text">
            {phase}
          </h3>
          <span className="phase-tasks-count">
            {tasksInPhase.length} action{tasksInPhase.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <ul className="phase-task-list">
        {tasksInPhase.map((task) => (
          <TaskItem key={task.id} task={task} isChecked={completedTasks.includes(task.id)} onToggle={toggleTask} />
        ))}
      </ul>
    </section>
  );
};
