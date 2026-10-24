import React from "react";
import { Notice } from "../../components/common/Notice";
import { SparklesIcon } from "../../components/common/Icons";
import { OverviewTabProps } from "./types";
import { SummaryMetrics } from "./SummaryMetrics";
import { SmartAlerts } from "./SmartAlerts";
import { NextActionsCard } from "./NextActionsCard";
import { BudgetDonutPreview } from "./BudgetDonutPreview";
import { ReadinessCard } from "./ReadinessCard";

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  budget,
  timeline,
  functions,
  vendors,
  weddingDate,
  today,
  completedTaskIds = [],
  onToggleTask = () => {},
  disclaimer = "",
}) => {
  const pendingTasks = timeline.tasks.filter((t) => !completedTaskIds.includes(t.id));
  const nextThreeActions = pendingTasks.slice(0, 3);
  const totalTasks = timeline.tasks.length;
  const completedCount = completedTaskIds.length;
  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const effectiveWeddingDate = weddingDate || overview.wedding_date;
  const overdueVendors = (vendors?.categories || []).filter((v) => {
    if (!effectiveWeddingDate) return false;
    try {
      const parts = effectiveWeddingDate.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() - v.lead_time_weeks * 7);
        const refToday = today ? new Date(today) : new Date();
        refToday.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < refToday.getTime();
      }
    } catch {
      return false;
    }
    return false;
  });

  const getRank = (name: string): number => {
    const n = name.toLowerCase();
    if (n.includes("venue")) return 1;
    if (n.includes("cater") || n.includes("dining")) return 2;
    if (n.includes("photo") || n.includes("cinema")) return 3;
    if (n.includes("decor") || n.includes("floral")) return 4;
    return 10;
  };

  const shortName = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("venue")) return "Venue";
    if (n.includes("cater")) return "Caterer";
    if (n.includes("photo")) return "Photographer";
    if (n.includes("decor")) return "Decorator";
    return name;
  };

  const sortedOverdue = [...overdueVendors].sort((a, b) => getRank(a.name) - getRank(b.name));
  const totalVendors = vendors?.categories?.length || overdueVendors.length;
  const topNames = sortedOverdue.slice(0, 3).map((v) => shortName(v.name)).join(", ");
  const compactWarning = `${overdueVendors.length} of ${totalVendors} vendors are past their standard booking window. Book these first: ${topNames}.`;

  const effectiveWarnings = overview.key_warnings
    .map((w) => (w.startsWith("Book these vendors immediately:") ? compactWarning : w))
    .filter(Boolean);

  if (overdueVendors.length > 0 && !effectiveWarnings.some((w) => w.includes("past their standard booking window"))) {
    effectiveWarnings.unshift(compactWarning);
  }

  return (
    <div className="overview-container">
      {overview.is_tight_timeline && (
        <Notice type="warning" title="Very Tight Timeline In Effect">
          Your wedding is only {overview.days_remaining} days away. High-priority milestones have been compressed for immediate booking.
        </Notice>
      )}

      <SummaryMetrics
        overview={overview}
        functions={functions}
        allocationsCount={budget.allocations.length}
        completedCount={completedCount}
        totalTasks={totalTasks}
      />

      <div className="overview-main-grid">
        <div className="overview-left-col">
          <section className="dashboard-card" aria-labelledby="executive-summary-heading">
            <div className="card-header-row">
              <h2 id="executive-summary-heading" className="card-heading">
                <SparklesIcon size={20} color="var(--color-primary)" />
                Executive Plan Summary
              </h2>
            </div>
            <p className="summary-paragraph">{overview.summary}</p>
          </section>

          <SmartAlerts
            effectiveWarnings={effectiveWarnings}
            suggestions={budget.suggestions}
            sortedOverdueVendors={sortedOverdue}
          />

          <NextActionsCard
            nextThreeActions={nextThreeActions}
            completedTaskIds={completedTaskIds}
            onToggleTask={onToggleTask}
          />
        </div>

        <div className="overview-right-col">
          <BudgetDonutPreview budget={budget} totalBudget={overview.total_budget} />
          <ReadinessCard
            completedCount={completedCount}
            totalTasks={totalTasks}
            completionPct={completionPct}
          />
        </div>
      </div>

      <p className="overview-disclaimer">{disclaimer}</p>
    </div>
  );
};
