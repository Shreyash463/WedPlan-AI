import React from "react";
import { VendorCategoryItem, VendorStatus } from "../../types";
import { formatCurrencyINR, formatDateReadable } from "../../utils/formatters";
import { AlertTriangleIcon, CheckIcon, ClockIcon } from "../../components/common/Icons";
import { VendorUrgency } from "./types";

interface VendorCardProps {
  vendor: VendorCategoryItem;
  currentStatus: VendorStatus;
  urgency: VendorUrgency;
  bookByIso: string | null;
  onStatusChange: (vendorId: string, status: VendorStatus) => void;
}

export const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  currentStatus,
  urgency,
  bookByIso,
  onStatusChange,
}) => {
  const getStatusChipClass = (status: VendorStatus) => {
    if (status === "Booked") return "status-chip-booked";
    if (status === "Contacted") return "status-chip-contacted";
    return "status-chip-not-started";
  };

  return (
    <article className="vendor-card">
      <div className="vendor-card-header">
        <div>
          <div className="vendor-title-row">
            <h3 className="vendor-title">{vendor.name}</h3>
            {urgency === "overdue" && (
              <span className="vendor-badge-overdue" role="status" aria-label={`Overdue: book now for ${vendor.name}`}>
                <AlertTriangleIcon size={12} color="currentColor" /> Overdue: book now
              </span>
            )}
            {urgency === "soon" && (
              <span className="vendor-badge-soon" role="status" aria-label={`Book soon for ${vendor.name}`}>
                <AlertTriangleIcon size={12} color="currentColor" /> Book soon
              </span>
            )}
          </div>
          <div className="vendor-lead-info">
            <ClockIcon size={14} color="var(--color-text-muted)" />
            <span>Lead time: {vendor.lead_time_weeks} weeks before</span>
            {bookByIso && <span className="book-by-highlight">(Book by {formatDateReadable(bookByIso)})</span>}
          </div>
        </div>
        <div className="vendor-budget-badge">{formatCurrencyINR(vendor.allocated_budget)}</div>
      </div>

      <div className="vendor-status-row">
        <span className="status-label">Status:</span>
        <div className="status-pills-group" role="radiogroup" aria-label={`Status for ${vendor.name}`}>
          {(["Not started", "Contacted", "Booked"] as VendorStatus[]).map((st) => {
            const isSelected = currentStatus === st;
            return (
              <button
                key={st}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`status-pill ${getStatusChipClass(st)} ${isSelected ? "active" : ""}`}
                onClick={() => onStatusChange(vendor.id, st)}
              >
                {st === "Booked" && isSelected && <CheckIcon size={12} />}
                {st}
              </button>
            );
          })}
        </div>
      </div>

      <div className="vendor-payment-guidance">
        <strong>Payment Terms:</strong> {vendor.advance_payment_guidance}
      </div>

      <div className="accordion-section">
        <details className="vendor-accordion">
          <summary>Questions to Ask During Tasting / Meetings ({vendor.questions_to_ask.length})</summary>
          <ul className="accordion-content-list">
            {vendor.questions_to_ask.map((q, idx) => (
              <li key={idx} className="accordion-list-item">
                <span className="bullet-indicator">•</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </details>

        <details className="vendor-accordion">
          <summary>Contract Clauses & Must-Haves ({vendor.contract_must_haves.length})</summary>
          <ul className="accordion-content-list">
            {vendor.contract_must_haves.map((c, idx) => (
              <li key={idx} className="accordion-list-item">
                <span className="bullet-indicator">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </article>
  );
};
