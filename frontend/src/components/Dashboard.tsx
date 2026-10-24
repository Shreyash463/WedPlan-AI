import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { BudgetPlan, IdeasPlan, PlanFormInput, PlanResponse } from "../types";
import { formatCoupleName } from "../utils/formatters";
import { cleanupLegacyKeys, computePlanFingerprint, getStoredTasks, saveStoredTasks } from "../utils/planStorage";
import { CalendarIcon, ChartPieIcon, RupeeIcon, SparklesIcon, UsersIcon } from "./common/Icons";
import { DashboardHeader } from "../features/dashboard/DashboardHeader";
import { PrintView } from "../features/print/PrintView";
import { buildPlainTextExport } from "../features/print/exportUtils";

const OverviewTab = lazy(() => import("./tabs/OverviewTab").then((m) => ({ default: m.OverviewTab })));
const BudgetTab = lazy(() => import("./tabs/BudgetTab").then((m) => ({ default: m.BudgetTab })));
const TimelineTab = lazy(() => import("./tabs/TimelineTab").then((m) => ({ default: m.TimelineTab })));
const VendorsTab = lazy(() => import("./tabs/VendorsTab").then((m) => ({ default: m.VendorsTab })));
const IdeasTab = lazy(() => import("./tabs/IdeasTab").then((m) => ({ default: m.IdeasTab })));

interface DashboardProps {
  initialPlan: PlanResponse;
  formData: PlanFormInput;
  onEditDetails: () => void;
}

type TabKey = "overview" | "budget" | "timeline" | "vendors" | "ideas";

const TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "overview", label: "Overview", icon: <ChartPieIcon size={18} /> },
  { key: "budget", label: "Budget & What-If", icon: <RupeeIcon size={18} /> },
  { key: "timeline", label: "Timeline", icon: <CalendarIcon size={18} /> },
  { key: "vendors", label: "Vendors", icon: <UsersIcon size={18} /> },
  { key: "ideas", label: "Personalized Ideas", icon: <SparklesIcon size={18} /> },
];

export const Dashboard: React.FC<DashboardProps> = ({ initialPlan, formData, onEditDetails }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [plan, setPlan] = useState<PlanResponse>(initialPlan);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const planHash = computePlanFingerprint(formData);
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    cleanupLegacyKeys();
    return getStoredTasks(planHash);
  });

  useEffect(() => { saveStoredTasks(planHash, completedTasks); }, [planHash, completedTasks]);
  useEffect(() => { setCompletedTasks(getStoredTasks(planHash)); }, [planHash]);

  useEffect(() => {
    const formatted = formatCoupleName(plan.overview.couple_name);
    document.title = formatted ? `${formatted}'s Wedding Plan - WedPlan AI` : "WedPlan AI - Indian Wedding Planner";
  }, [plan.overview.couple_name]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
  };

  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIdx = index;
    if (e.key === "ArrowRight") newIdx = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") newIdx = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") newIdx = 0;
    else if (e.key === "End") newIdx = TABS.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(TABS[newIdx].key);
    tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')?.[newIdx]?.focus();
  };

  const handleCopyAsText = async () => {
    const text = buildPlainTextExport(plan, completedTasks);
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage("Full wedding plan copied to clipboard!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage("Could not copy automatically. Please copy manually.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="screen-only">
        <DashboardHeader
          plan={plan} style={formData.style} onEditDetails={onEditDetails}
          onPrint={() => window.print()} onCopyText={handleCopyAsText} toastMessage={toastMessage}
        />

        <nav aria-label="Wedding Planning Sections" className="tabs-navigation-wrapper">
          <div ref={tabListRef} role="tablist" aria-label="Planning Sections" className="tab-list">
            {TABS.map((tab, idx) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key} role="tab" id={`tab-${tab.key}`} aria-selected={isSelected}
                  aria-controls={`panel-${tab.key}`} tabIndex={isSelected ? 0 : -1}
                  className={`tab-btn ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)} onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <Suspense fallback={<div className="tab-loading-state"><span className="spinner" aria-hidden="true" /><p>Loading planning section...</p></div>}>
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" tabIndex={0} className={`tab-panel ${activeTab === "overview" ? "active" : ""}`} hidden={activeTab !== "overview"}>
            {activeTab === "overview" && <OverviewTab overview={plan.overview} budget={plan.budget} timeline={plan.timeline} functions={formData.functions} vendors={plan.vendors} weddingDate={formData.wedding_date} completedTaskIds={completedTasks} onToggleTask={toggleTask} disclaimer={plan.disclaimer} />}
          </div>
          <div role="tabpanel" id="panel-budget" aria-labelledby="tab-budget" tabIndex={0} className={`tab-panel ${activeTab === "budget" ? "active" : ""}`} hidden={activeTab !== "budget"}>
            {activeTab === "budget" && <BudgetTab budgetPlan={plan.budget} originalBudget={initialPlan.budget.total_budget} city={formData.city} cityTier={formData.city_tier} weddingDate={formData.wedding_date} functions={formData.functions} style={formData.style} initialPriorities={formData.priorities} onBudgetUpdated={(b: BudgetPlan) => setPlan((p) => ({ ...p, budget: b }))} />}
          </div>
          <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" tabIndex={0} className={`tab-panel ${activeTab === "timeline" ? "active" : ""}`} hidden={activeTab !== "timeline"}>
            {activeTab === "timeline" && <TimelineTab timelinePlan={plan.timeline} completedTasks={completedTasks} onToggleTask={toggleTask} />}
          </div>
          <div role="tabpanel" id="panel-vendors" aria-labelledby="tab-vendors" tabIndex={0} className={`tab-panel ${activeTab === "vendors" ? "active" : ""}`} hidden={activeTab !== "vendors"}>
            {activeTab === "vendors" && <VendorsTab vendorPlan={plan.vendors} weddingDate={formData.wedding_date} planHash={planHash} />}
          </div>
          <div role="tabpanel" id="panel-ideas" aria-labelledby="tab-ideas" tabIndex={0} className={`tab-panel ${activeTab === "ideas" ? "active" : ""}`} hidden={activeTab !== "ideas"}>
            {activeTab === "ideas" && <IdeasTab ideasPlan={plan.ideas} city={formData.city} cityTier={formData.city_tier} totalBudget={plan.budget.total_budget} guestCount={plan.budget.guest_count} functions={formData.functions} style={formData.style} priorities={formData.priorities} specialRequests={formData.special_requests} onIdeasUpdated={(ideas: IdeasPlan) => setPlan((p) => ({ ...p, ideas }))} />}
          </div>
        </Suspense>
      </div>

      <PrintView plan={plan} style={formData.style} />
    </div>
  );
};
