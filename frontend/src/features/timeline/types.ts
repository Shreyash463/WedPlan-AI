import { TimelinePlan } from "../../types";

export interface TimelineTabProps {
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
