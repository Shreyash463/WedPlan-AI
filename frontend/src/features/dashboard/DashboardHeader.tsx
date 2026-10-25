import React from "react";
import { PlanResponse } from "../../types";
import { capitalizeCity, formatCoupleName, formatCurrencyINR, formatDateReadable } from "../../utils/formatters";
import { CopyIcon, EditIcon, PrintIcon } from "../../components/common/Icons";

interface DashboardHeaderProps {
  plan: PlanResponse;
  style: string;
  onEditDetails: () => void;
  onPrint: () => void;
  onCopyText: () => void;
  toastMessage: string | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  plan,
  style,
  onEditDetails,
  onPrint,
  onCopyText,
  toastMessage,
}) => {
  const coupleNameFormatted = formatCoupleName(plan.overview.couple_name);

  return (
    <div className="dashboard-header-card">
      <div className="dashboard-header-top">
        <div className="title-area">
          <h1 className="plan-title">
            {coupleNameFormatted ? `${coupleNameFormatted}'s Celebration Plan` : "Your Personalized Wedding Plan"}
          </h1>
          <div className="plan-meta-chips">
            <span className="meta-chip date-chip">
              {formatDateReadable(plan.overview.wedding_date)} ({plan.overview.days_remaining} days to go)
            </span>
            <span className="meta-chip city-chip">
              {capitalizeCity(plan.overview.city)} ({plan.overview.city_tier})
            </span>
            <span className="meta-chip style-chip">{style} Style</span>
          </div>
        </div>

        <div className="actions-area">
          <button
            type="button"
            className="btn btn-outline edit-btn"
            onClick={onEditDetails}
            aria-label="Edit Celebration Details"
          >
            <EditIcon size={16} />
            <span>Edit Details</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary print-btn"
            onClick={onPrint}
            aria-label="Print or Download PDF Planning Guide"
          >
            <PrintIcon size={16} />
            <span>Print / PDF</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary copy-btn"
            onClick={onCopyText}
            aria-label="Copy entire wedding plan as formatted text"
          >
            <CopyIcon size={16} />
            <span>Copy Plan</span>
          </button>
        </div>
      </div>

      <div className="dashboard-stats-strip">
        <div className="stat-pill">
          <span className="pill-label">Total Budget</span>
          <span className="pill-value">{formatCurrencyINR(plan.budget.total_budget)}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">Guest Scale</span>
          <span className="pill-value">{plan.overview.guest_count} attendees</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">Calculated Feasibility</span>
          <span className="pill-value">{plan.budget.health_status}</span>
        </div>
      </div>

      {toastMessage && (
        <div role="status" aria-live="polite" className="toast-notification">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
