import React, { useState, useRef, Suspense, lazy } from "react";
import {
  BudgetPlan,
  CANONICAL_PHASES,
  IdeasPlan,
  PlanFormInput,
  PlanResponse,
  TimelineTask,
} from "../types";
import {
  capitalizeCity,
  formatCurrencyINR,
  formatDateReadable,
  formatPercentage,
} from "../utils/formatters";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  CalendarIcon,
  ChartPieIcon,
  CopyIcon,
  EditIcon,
  PrintIcon,
  RupeeIcon,
  SparklesIcon,
  UsersIcon,
} from "./common/Icons";

// Code-split tabs with React.lazy
const OverviewTab = lazy(() =>
  import("./tabs/OverviewTab").then((m) => ({ default: m.OverviewTab }))
);
const BudgetTab = lazy(() =>
  import("./tabs/BudgetTab").then((m) => ({ default: m.BudgetTab }))
);
const TimelineTab = lazy(() =>
  import("./tabs/TimelineTab").then((m) => ({ default: m.TimelineTab }))
);
const VendorsTab = lazy(() =>
  import("./tabs/VendorsTab").then((m) => ({ default: m.VendorsTab }))
);
const IdeasTab = lazy(() =>
  import("./tabs/IdeasTab").then((m) => ({ default: m.IdeasTab }))
);

interface DashboardProps {
  initialPlan: PlanResponse;
  formData: PlanFormInput;
  onEditDetails: () => void;
}

type TabKey = "overview" | "budget" | "timeline" | "vendors" | "ideas";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { key: "overview", label: "Overview", icon: <ChartPieIcon size={18} /> },
  { key: "budget", label: "Budget & What-If", icon: <RupeeIcon size={18} /> },
  { key: "timeline", label: "Timeline", icon: <CalendarIcon size={18} /> },
  { key: "vendors", label: "Vendors", icon: <UsersIcon size={18} /> },
  { key: "ideas", label: "Personalized Ideas", icon: <SparklesIcon size={18} /> },
];

export const Dashboard: React.FC<DashboardProps> = ({
  initialPlan,
  formData,
  onEditDetails,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [plan, setPlan] = useState<PlanResponse>(initialPlan);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronized completed tasks state
  const [completedTasks, setCompletedTasks] = useLocalStorage<string[]>(
    "wedplan_completed_tasks",
    []
  );

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const tabListRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Keyboard navigation for WAI-ARIA tablist (Left, Right, Home, End)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex: number;
    if (e.key === "ArrowRight") {
      newIndex = (index + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = TABS[newIndex].key;
    setActiveTab(nextTab);

    const tabButtons = tabListRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]'
    );
    if (tabButtons && tabButtons[newIndex]) {
      tabButtons[newIndex].focus();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Comprehensive plain text copy containing ALL sections
  const handleCopyAsText = async () => {
    // Group timeline tasks by phase
    const tasksByPhase: Record<string, TimelineTask[]> = {};
    for (const p of CANONICAL_PHASES) tasksByPhase[p] = [];
    for (const t of plan.timeline.tasks) {
      if (!tasksByPhase[t.phase]) tasksByPhase[t.phase] = [];
      tasksByPhase[t.phase].push(t);
    }

    const timelineTextLines: string[] = [];
    for (const p of CANONICAL_PHASES) {
      const pTasks = tasksByPhase[p] || [];
      if (pTasks.length > 0) {
        timelineTextLines.push(`\n[Phase: ${p}]`);
        for (const t of pTasks) {
          const status = completedTasks.includes(t.id) ? "[X]" : "[ ]";
          const overdue = t.is_overdue_standard ? " (Overdue standard lead time)" : "";
          timelineTextLines.push(
            `  ${status} ${t.title} | Priority: ${t.priority} | Due: ${t.due_date}${overdue}\n     Description: ${t.description}`
          );
        }
      }
    }

    const vendorTextLines = plan.vendors.categories.map((v) => {
      return [
        `• ${v.name}:`,
        `  Allocated Budget: ${formatCurrencyINR(v.allocated_budget)} | Lead Time: ${v.lead_time_weeks} weeks before`,
        `  Payment Terms: ${v.advance_payment_guidance}`,
        `  Questions to Ask:`,
        ...v.questions_to_ask.map((q) => `    - ${q}`),
        `  Contract Must-Haves:`,
        ...v.contract_must_haves.map((c) => `    - ${c}`),
      ].join("\n");
    });

    const textLines = [
      `=====================================================`,
      `WEDPLAN AI - COMPREHENSIVE INDIAN WEDDING PLAN`,
      `=====================================================`,
      `Event: ${plan.overview.couple_name || "Indian Wedding Celebration"}`,
      `Date: ${formatDateReadable(plan.overview.wedding_date)} (${plan.overview.days_remaining} days remaining)`,
      `Location: ${capitalizeCity(plan.overview.city)} (${plan.overview.city_tier})`,
      `Guests: ${plan.overview.guest_count} | Total Budget: ${formatCurrencyINR(plan.budget.total_budget)}`,
      `Per-Guest Spend: ${formatCurrencyINR(plan.budget.cost_per_guest)} | Health: ${plan.budget.health_status}`,
      ``,
      `--- EXECUTIVE SUMMARY ---`,
      plan.overview.summary,
      ``,
      ...(plan.overview.key_warnings.length > 0
        ? [
            `--- KEY PLANNER ALERTS ---`,
            ...plan.overview.key_warnings.map((w) => `• ${w}`),
            ``,
          ]
        : []),
      `--- BUDGET ALLOCATION BREAKDOWN ---`,
      ...plan.budget.allocations.map(
        (a) =>
          `• ${a.category.padEnd(28)}: ${formatCurrencyINR(a.amount).padStart(12)} (${formatPercentage(a.percentage).padStart(5)}) - ${a.description}`
      ),
      `• Total Budget Allocated     : ${formatCurrencyINR(plan.budget.total_budget)} (100.0%)`,
      ``,
      `--- COUNTDOWN TIMELINE ROADMAP ---`,
      ...timelineTextLines,
      ``,
      `--- VENDOR PROCUREMENT CHECKLIST & CONTRACTS ---`,
      ...vendorTextLines,
      ``,
      `--- PERSONALIZED CELEBRATION IDEAS ---`,
      `Themes & Decor:`,
      ...plan.ideas.themes_and_decor.map((td) => `  • ${td}`),
      ``,
      `Catering & Menu:`,
      ...plan.ideas.catering_and_menu.map((m) => `  • ${m}`),
      ``,
      `Ceremony Activities:`,
      ...plan.ideas.function_activities.map((a) => `  • ${a.function}: ${a.activity}`),
      ``,
      `Thoughtful Guest Hospitality:`,
      ...plan.ideas.guest_experience_ideas.map((g) => `  • ${g}`),
      ``,
      `Tailored Money-Saving Hacks:`,
      ...plan.ideas.money_saving_hacks.map((h, i) => `  ${i + 1}. ${h}`),
      ``,
      `=====================================================`,
      `Generated by WedPlan AI (https://wedplan.ai)`,
      `Disclaimer: ${plan.disclaimer}`,
    ];

    try {
      await navigator.clipboard.writeText(textLines.join("\n"));
      showToast("Full wedding plan copied to clipboard!");
    } catch {
      showToast("Unable to copy to clipboard.");
    }
  };

  const updateBudget = (newBudget: BudgetPlan) => {
    setPlan((prev) => ({
      ...prev,
      budget: newBudget,
      overview: {
        ...prev.overview,
        total_budget: newBudget.total_budget,
        guest_count: newBudget.guest_count,
        cost_per_guest: newBudget.cost_per_guest,
        health_status: newBudget.health_status,
        key_warnings: newBudget.warnings,
      },
    }));
  };

  const updateIdeas = (newIdeas: IdeasPlan) => {
    setPlan((prev) => ({
      ...prev,
      ideas: newIdeas,
    }));
    showToast("Wedding ideas refreshed!");
  };

  // Group timeline tasks for the print layout
  const printTasksByPhase: Record<string, TimelineTask[]> = {};
  for (const p of CANONICAL_PHASES) printTasksByPhase[p] = [];
  for (const t of plan.timeline.tasks) {
    if (!printTasksByPhase[t.phase]) printTasksByPhase[t.phase] = [];
    printTasksByPhase[t.phase].push(t);
  }
  const printActivePhases = CANONICAL_PHASES.filter(
    (p) => printTasksByPhase[p] && printTasksByPhase[p].length > 0
  );

  return (
    <div className="dashboard-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="toast-msg" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      {/* Screen Interactive Container */}
      <div id="interactive-dashboard-root">
        {/* Dashboard Top Header & Actions Card */}
        <section className="dashboard-header-card" aria-label="Dashboard Overview">
          <div className="dashboard-title-group">
            <h1>
              {plan.overview.couple_name
                ? `${plan.overview.couple_name}'s Wedding Plan`
                : "Your Personalized Wedding Plan"}
            </h1>
            <div className="dashboard-subtitle">
              <span>{formatDateReadable(plan.overview.wedding_date)}</span>
              <span>&bull;</span>
              <span>{capitalizeCity(plan.overview.city)} ({plan.overview.city_tier})</span>
              <span>&bull;</span>
              <span>{plan.overview.guest_count} Guests</span>
              <span>&bull;</span>
              <span className="subtitle-budget">{formatCurrencyINR(plan.budget.total_budget)}</span>
            </div>
          </div>

          <div className="dashboard-actions">
            <button
              type="button"
              className="btn btn-secondary action-btn"
              onClick={onEditDetails}
              aria-label="Edit intake form details"
            >
              <EditIcon size={16} />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary action-btn"
              onClick={handleCopyAsText}
              aria-label="Copy entire wedding plan as plain text"
            >
              <CopyIcon size={16} />
              <span>Copy Plan</span>
            </button>
            <button
              type="button"
              className="btn btn-primary action-btn"
              onClick={handlePrint}
              aria-label="Print or download complete wedding plan as PDF"
            >
              <PrintIcon size={16} />
              <span>Download / Print</span>
            </button>
          </div>
        </section>

        {/* Tablist with Arrow-Key Keyboard Navigation */}
        <nav aria-label="Wedding Planning Sections" className="tabs-navigation-wrapper">
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Planning Sections"
            className="tab-list"
          >
            {TABS.map((tab, idx) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.key}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`tab-btn ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Interactive Tab Panels (Code-Split) */}
        <Suspense
          fallback={
            <div className="tab-loading-state">
              <span className="spinner" aria-hidden="true" />
              <p>Loading planning section...</p>
            </div>
          }
        >
          {/* 1. Overview Tab Panel */}
          <div
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
            tabIndex={0}
            className={`tab-panel ${activeTab === "overview" ? "active" : ""}`}
            hidden={activeTab !== "overview"}
          >
            {activeTab === "overview" && (
              <OverviewTab
                overview={plan.overview}
                budget={plan.budget}
                timeline={plan.timeline}
                functions={formData.functions}
                completedTaskIds={completedTasks}
                onToggleTask={toggleTask}
                disclaimer={plan.disclaimer}
              />
            )}
          </div>

          {/* 2. Budget Tab Panel */}
          <div
            role="tabpanel"
            id="panel-budget"
            aria-labelledby="tab-budget"
            tabIndex={0}
            className={`tab-panel ${activeTab === "budget" ? "active" : ""}`}
            hidden={activeTab !== "budget"}
          >
            {activeTab === "budget" && (
              <BudgetTab
                budgetPlan={plan.budget}
                originalBudget={initialPlan.budget.total_budget}
                city={formData.city}
                cityTier={formData.city_tier}
                weddingDate={formData.wedding_date}
                functions={formData.functions}
                style={formData.style}
                initialPriorities={formData.priorities}
                onBudgetUpdated={updateBudget}
              />
            )}
          </div>

          {/* 3. Timeline Tab Panel */}
          <div
            role="tabpanel"
            id="panel-timeline"
            aria-labelledby="tab-timeline"
            tabIndex={0}
            className={`tab-panel ${activeTab === "timeline" ? "active" : ""}`}
            hidden={activeTab !== "timeline"}
          >
            {activeTab === "timeline" && (
              <TimelineTab
                timelinePlan={plan.timeline}
                completedTasks={completedTasks}
                onToggleTask={toggleTask}
              />
            )}
          </div>

          {/* 4. Vendors Tab Panel */}
          <div
            role="tabpanel"
            id="panel-vendors"
            aria-labelledby="tab-vendors"
            tabIndex={0}
            className={`tab-panel ${activeTab === "vendors" ? "active" : ""}`}
            hidden={activeTab !== "vendors"}
          >
            {activeTab === "vendors" && (
              <VendorsTab
                vendorPlan={plan.vendors}
                weddingDate={formData.wedding_date}
              />
            )}
          </div>

          {/* 5. Ideas Tab Panel */}
          <div
            role="tabpanel"
            id="panel-ideas"
            aria-labelledby="tab-ideas"
            tabIndex={0}
            className={`tab-panel ${activeTab === "ideas" ? "active" : ""}`}
            hidden={activeTab !== "ideas"}
          >
            {activeTab === "ideas" && (
              <IdeasTab
                ideasPlan={plan.ideas}
                city={formData.city}
                cityTier={formData.city_tier}
                totalBudget={plan.budget.total_budget}
                guestCount={plan.budget.guest_count}
                functions={formData.functions}
                style={formData.style}
                priorities={formData.priorities}
                specialRequests={formData.special_requests}
                onIdeasUpdated={updateIdeas}
              />
            )}
          </div>
        </Suspense>
      </div>

      {/* DEDICATED PRINT ROOT (Rendered ONLY under @media print) */}
      <div id="print-root" className="print-only" aria-hidden="true">
        {/* Print Header */}
        <header className="print-header">
          <div className="print-title-row">
            <div>
              <h1 className="print-main-title">
                {plan.overview.couple_name
                  ? `${plan.overview.couple_name}'s Wedding Master Plan`
                  : "Indian Wedding Master Planning Guide"}
              </h1>
              <div className="print-meta-line">
                <span><strong>Date:</strong> {formatDateReadable(plan.overview.wedding_date)} ({plan.overview.days_remaining} days away)</span>
                <span> &bull; </span>
                <span><strong>City:</strong> {capitalizeCity(plan.overview.city)} ({plan.overview.city_tier})</span>
                <span> &bull; </span>
                <span><strong>Vibe:</strong> {formData.style}</span>
              </div>
            </div>
            <div className="print-badge-col">
              <div className="print-stat-pill">
                <strong>Budget:</strong> {formatCurrencyINR(plan.budget.total_budget)}
              </div>
              <div className="print-stat-pill">
                <strong>Guests:</strong> {plan.overview.guest_count} ({formatCurrencyINR(plan.budget.cost_per_guest)}/guest)
              </div>
              <div className="print-stat-pill">
                <strong>Health:</strong> {plan.budget.health_status}
              </div>
            </div>
          </div>
        </header>

        {/* Print Section 1: Executive Summary */}
        <section className="print-section">
          <h2 className="print-section-title">1. Executive Summary & Alerts</h2>
          <p className="print-summary-text">{plan.overview.summary}</p>
          {plan.overview.key_warnings.length > 0 && (
            <div className="print-warnings-block">
              <strong>Key Planner Considerations:</strong>
              <ul>
                {plan.overview.key_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Print Section 2: Budget Breakdown Table */}
        <section className="print-section">
          <h2 className="print-section-title">2. Budget Allocation Breakdown</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "25%" }}>Category</th>
                <th style={{ width: "15%", textAlign: "right" }}>Percentage</th>
                <th style={{ width: "20%", textAlign: "right" }}>Allocated Amount</th>
                <th style={{ width: "40%" }}>Scope & Notes</th>
              </tr>
            </thead>
            <tbody>
              {plan.budget.allocations.map((a) => (
                <tr key={a.category}>
                  <td><strong>{a.category}</strong></td>
                  <td style={{ textAlign: "right" }}>{formatPercentage(a.percentage)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrencyINR(a.amount)}</td>
                  <td>{a.description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total Planned Budget</strong></td>
                <td style={{ textAlign: "right" }}><strong>100.0%</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatCurrencyINR(plan.budget.total_budget)}</strong></td>
                <td><strong>Exact Hamiltonian split with 0 rupee discrepancy</strong></td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Print Section 3: Countdown Timeline Roadmap */}
        <section className="print-section">
          <h2 className="print-section-title">3. Countdown Preparation Roadmap</h2>
          {printActivePhases.map((phase) => {
            const phaseTasks = printTasksByPhase[phase] || [];
            return (
              <div key={phase} className="print-phase-block">
                <h3 className="print-phase-heading">{phase}</h3>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: "10%" }}>Target Date</th>
                      <th style={{ width: "10%" }}>Priority</th>
                      <th style={{ width: "30%" }}>Action Milestone</th>
                      <th style={{ width: "50%" }}>Execution Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phaseTasks.map((t) => (
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
            );
          })}
        </section>

        {/* Print Section 4: Vendor Procurement Checklist */}
        <section className="print-section">
          <h2 className="print-section-title">4. Vendor Procurement Checklist & Contract Clauses</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>Vendor Category</th>
                <th style={{ width: "14%", textAlign: "right" }}>Budget</th>
                <th style={{ width: "13%" }}>Lead Time</th>
                <th style={{ width: "25%" }}>Key Questions to Ask</th>
                <th style={{ width: "30%" }}>Contract Must-Haves</th>
              </tr>
            </thead>
            <tbody>
              {plan.vendors.categories.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.name}</strong></td>
                  <td style={{ textAlign: "right" }}>{formatCurrencyINR(v.allocated_budget)}</td>
                  <td>{v.lead_time_weeks} weeks</td>
                  <td>
                    <ul className="print-mini-list">
                      {v.questions_to_ask.slice(0, 2).map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <ul className="print-mini-list">
                      {v.contract_must_haves.slice(0, 2).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Print Section 5: Personalized Ideas */}
        <section className="print-section">
          <h2 className="print-section-title">5. Personalized Celebration Ideas</h2>
          <div className="print-ideas-grid">
            <div className="print-idea-box">
              <h3>Themes & Mandap Decor</h3>
              <ul>
                {plan.ideas.themes_and_decor.map((td, i) => (
                  <li key={i}>{td}</li>
                ))}
              </ul>
            </div>
            <div className="print-idea-box">
              <h3>Catering & Menu Highlights</h3>
              <ul>
                {plan.ideas.catering_and_menu.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="print-idea-box">
              <h3>Function Activities</h3>
              <ul>
                {plan.ideas.function_activities.map((a, i) => (
                  <li key={i}><strong>{a.function}:</strong> {a.activity}</li>
                ))}
              </ul>
            </div>
            <div className="print-idea-box">
              <h3>Money-Saving Hacks</h3>
              <ul>
                {plan.ideas.money_saving_hacks.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Print Footer / Disclaimer */}
        <footer className="print-footer">
          <p>Generated by WedPlan AI &bull; {plan.disclaimer}</p>
        </footer>
      </div>
    </div>
  );
};
