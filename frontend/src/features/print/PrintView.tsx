import React from "react";
import { PlanResponse } from "../../types";
import { capitalizeCity, formatCurrencyINR, formatDateReadable, formatPercentage } from "../../utils/formatters";
import { PrintTimelineSection } from "./PrintTimelineSection";

interface PrintViewProps {
  plan: PlanResponse;
  style: string;
}

export const PrintView: React.FC<PrintViewProps> = ({ plan, style }) => {
  return (
    <div id="print-root" className="print-only" aria-hidden="true">
      <header className="print-header">
        <div className="print-title-row">
          <div>
            <h1 className="print-main-title">
              {plan.overview.couple_name ? `${plan.overview.couple_name}'s Wedding Master Plan` : "Indian Wedding Master Planning Guide"}
            </h1>
            <div className="print-meta-line">
              <span><strong>Date:</strong> {formatDateReadable(plan.overview.wedding_date)} ({plan.overview.days_remaining} days away)</span>
              <span> &bull; </span>
              <span><strong>City:</strong> {capitalizeCity(plan.overview.city)} ({plan.overview.city_tier})</span>
              <span> &bull; </span>
              <span><strong>Vibe:</strong> {style}</span>
            </div>
          </div>
          <div className="print-badge-col">
            <div className="print-stat-pill"><strong>Budget:</strong> {formatCurrencyINR(plan.budget.total_budget)}</div>
            <div className="print-stat-pill"><strong>Guests:</strong> {plan.overview.guest_count} ({formatCurrencyINR(plan.budget.cost_per_guest)}/guest)</div>
            <div className="print-stat-pill"><strong>Health:</strong> {plan.budget.health_status}</div>
          </div>
        </div>
      </header>

      <section className="print-section">
        <h2 className="print-section-title">1. Executive Summary & Alerts</h2>
        <p className="print-summary-text">{plan.overview.summary}</p>
        {plan.overview.key_warnings.length > 0 && (
          <div className="print-warnings-block">
            <strong>Key Planner Considerations:</strong>
            <ul>{plan.overview.key_warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}
      </section>

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
              <td><strong>Exact split with 0 rupee discrepancy</strong></td>
            </tr>
          </tfoot>
        </table>
      </section>

      <PrintTimelineSection tasks={plan.timeline.tasks} />

      <section className="print-section">
        <h2 className="print-section-title">4. Vendor Procurement Checklist</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Category</th>
              <th style={{ width: "15%", textAlign: "right" }}>Budget</th>
              <th style={{ width: "15%" }}>Lead Time</th>
              <th style={{ width: "50%" }}>Key Questions</th>
            </tr>
          </thead>
          <tbody>
            {plan.vendors.categories.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.name}</strong></td>
                <td style={{ textAlign: "right" }}>{formatCurrencyINR(v.allocated_budget)}</td>
                <td>{v.lead_time_weeks} weeks</td>
                <td>{v.questions_to_ask.slice(0, 2).join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h2 className="print-section-title">5. Personalized Celebration Ideas</h2>
        <div className="print-ideas-grid">
          <div className="print-idea-box">
            <h3>Themes & Mandap Decor</h3>
            <ul>{plan.ideas.themes_and_decor.map((td, i) => <li key={i}>{td}</li>)}</ul>
          </div>
          <div className="print-idea-box">
            <h3>Catering & Menu Highlights</h3>
            <ul>{plan.ideas.catering_and_menu.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
          <div className="print-idea-box">
            <h3>Function Activities</h3>
            <ul>{plan.ideas.function_activities.map((a, i) => <li key={i}><strong>{a.function}:</strong> {a.activity}</li>)}</ul>
          </div>
          <div className="print-idea-box">
            <h3>Money-Saving Hacks</h3>
            <ul>{plan.ideas.money_saving_hacks.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </div>
        </div>
      </section>

      <footer className="print-footer">
        <p>Generated by WedPlan AI &bull; {plan.disclaimer}</p>
      </footer>
    </div>
  );
};
