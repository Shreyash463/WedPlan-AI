import React from "react";
import { CANONICAL_PHASES, TimelineTask } from "../../types";
import { formatDateReadable } from "../../utils/formatters";

interface PrintTimelineSectionProps {
  tasks: TimelineTask[];
}

export const PrintTimelineSection: React.FC<PrintTimelineSectionProps> = ({ tasks }) => {
  const tasksByPhase: Record<string, TimelineTask[]> = {};
  for (const p of CANONICAL_PHASES) tasksByPhase[p] = [];
  for (const t of tasks) {
    if (!tasksByPhase[t.phase]) tasksByPhase[t.phase] = [];
    tasksByPhase[t.phase].push(t);
  }
  const activePhases = CANONICAL_PHASES.filter(
    (p) => tasksByPhase[p] && tasksByPhase[p].length > 0
  );

  return (
    <section className="print-section">
      <h2 className="print-section-title">3. Countdown Preparation Roadmap</h2>
      {activePhases.map((phase) => (
        <div key={phase} className="print-phase-block">
          <h3 className="print-phase-heading">{phase}</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Target Date</th>
                <th style={{ width: "10%" }}>Priority</th>
                <th style={{ width: "28%" }}>Milestone</th>
                <th style={{ width: "50%" }}>Execution Details</th>
              </tr>
            </thead>
            <tbody>
              {(tasksByPhase[phase] || []).map((t) => (
                <tr key={t.id}>
                  <td>{formatDateReadable(t.due_date)}</td>
                  <td><strong>{t.priority}</strong></td>
                  <td>{t.title}</td>
                  <td>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
};
