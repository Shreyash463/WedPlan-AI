import React from "react";
import { VendorPlan, VendorStatus } from "../../types";
import { formatCurrencyINR, formatDateReadable } from "../../utils/formatters";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { AlertTriangleIcon, CheckIcon, ClockIcon, UsersIcon } from "../common/Icons";

interface VendorsTabProps {
  vendorPlan: VendorPlan;
  weddingDate?: string;
  today?: Date | string;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({ vendorPlan, weddingDate, today }) => {
  // Persist vendor booking status per category ID
  const [vendorStatuses, setVendorStatuses] = useLocalStorage<Record<string, VendorStatus>>(
    "wedplan_vendor_statuses",
    {}
  );

  const handleStatusChange = (vendorId: string, status: VendorStatus) => {
    setVendorStatuses((prev) => ({
      ...prev,
      [vendorId]: status,
    }));
  };

  const getStatusChipClass = (status: VendorStatus) => {
    if (status === "Booked") return "status-chip-booked";
    if (status === "Contacted") return "status-chip-contacted";
    return "status-chip-not-started";
  };

  // Helper to compute book-by date and urgency
  const getVendorUrgency = (
    leadTimeWeeks: number
  ): { bookByIso: string | null; urgency: "overdue" | "soon" | "normal" } => {
    if (!weddingDate) return { bookByIso: null, urgency: "normal" };
    try {
      const parts = weddingDate.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() - leadTimeWeeks * 7);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const bookByIso = `${y}-${m}-${day}`;

        const refToday = today ? new Date(today) : new Date();
        refToday.setHours(0, 0, 0, 0);

        const targetDate = new Date(d);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - refToday.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          return { bookByIso, urgency: "overdue" };
        } else if (diffDays <= 14) {
          return { bookByIso, urgency: "soon" };
        } else {
          return { bookByIso, urgency: "normal" };
        }
      }
    } catch {
      return { bookByIso: null, urgency: "normal" };
    }
    return { bookByIso: null, urgency: "normal" };
  };

  return (
    <div className="vendors-tab-container">
      <div className="vendors-header-banner">
        <div>
          <h2 className="vendors-section-title">
            <UsersIcon size={20} color="var(--color-primary)" /> Vendor Procurement & Checklist
          </h2>
          <p className="vendors-section-subtitle">
            Manage your booking pipeline, track payments, and verify contract requirements tailored for Indian wedding vendors.
          </p>
        </div>
      </div>

      <div className="vendors-grid">
        {vendorPlan.categories.map((vendor) => {
          const currentStatus: VendorStatus =
            vendorStatuses[vendor.id] || vendor.default_status || "Not started";
          const { bookByIso, urgency } = getVendorUrgency(vendor.lead_time_weeks);

          return (
            <article key={vendor.id} className="vendor-card">
              <div className="vendor-card-header">
                <div>
                  <div className="vendor-title-row">
                    <h3 className="vendor-title">{vendor.name}</h3>
                    {urgency === "overdue" && (
                      <span
                        className="vendor-badge-overdue"
                        role="status"
                        aria-label={`Overdue: book now for ${vendor.name}`}
                      >
                        <AlertTriangleIcon size={12} color="currentColor" /> Overdue: book now
                      </span>
                    )}
                    {urgency === "soon" && (
                      <span
                        className="vendor-badge-soon"
                        role="status"
                        aria-label={`Book soon for ${vendor.name}`}
                      >
                        <AlertTriangleIcon size={12} color="currentColor" /> Book soon
                      </span>
                    )}
                  </div>
                  <div className="vendor-lead-info">
                    <ClockIcon size={14} color="var(--color-text-muted)" />
                    <span>Lead time: {vendor.lead_time_weeks} weeks before</span>
                    {bookByIso && (
                      <span className="book-by-highlight">
                        (Book by {formatDateReadable(bookByIso)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="vendor-budget-badge">
                  {formatCurrencyINR(vendor.allocated_budget)}
                </div>
              </div>

              {/* Status Selector with Custom Chips */}
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
                        onClick={() => handleStatusChange(vendor.id, st)}
                      >
                        {st === "Booked" && isSelected && <CheckIcon size={12} />}
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advance Payment Guidance */}
              <div className="vendor-payment-guidance">
                <strong>Payment Terms:</strong> {vendor.advance_payment_guidance}
              </div>

              {/* Accordions for Questions & Contract Clauses */}
              <div className="accordion-section">
                <details className="vendor-accordion">
                  <summary>
                    Questions to Ask During Tasting / Meetings ({vendor.questions_to_ask.length})
                  </summary>
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
                  <summary>
                    Contract Clauses & Must-Haves ({vendor.contract_must_haves.length})
                  </summary>
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
        })}
      </div>
    </div>
  );
};
