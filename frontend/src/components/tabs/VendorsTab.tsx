import React from "react";
import { VendorPlan, VendorStatus } from "../../types";
import { formatCurrencyINR } from "../../utils/formatters";
import { useLocalStorage } from "../../hooks/useLocalStorage";

interface VendorsTabProps {
  vendorPlan: VendorPlan;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({ vendorPlan }) => {
  // Persist vendor booking status per category ID
  const [vendorStatuses, setVendorStatuses] = useLocalStorage<
    Record<string, VendorStatus>
  >("wedplan_vendor_statuses", {});

  const handleStatusChange = (vendorId: string, status: VendorStatus) => {
    setVendorStatuses((prev) => ({
      ...prev,
      [vendorId]: status,
    }));
  };

  const getStatusColor = (status: VendorStatus) => {
    if (status === "Booked") return "var(--color-healthy)";
    if (status === "Contacted") return "var(--color-tight)";
    return "var(--color-text-muted)";
  };

  return (
    <div className="vendors-tab-container">
      <div
        style={{
          marginBottom: "var(--space-lg)",
          color: "var(--color-text-muted)",
          fontSize: "0.95rem",
        }}
      >
        Track your booking conversations, inspect allocated budgets, and verify
        critical contract clauses tailored for Indian vendor negotiations.
      </div>

      <div className="vendors-grid">
        {vendorPlan.categories.map((vendor) => {
          const currentStatus: VendorStatus =
            vendorStatuses[vendor.id] || vendor.default_status || "Not started";

          return (
            <article key={vendor.id} className="vendor-card">
              <div className="vendor-card-header">
                <div>
                  <h3 className="vendor-title">{vendor.name}</h3>
                  <div className="vendor-lead-info">
                    Recommended Lead Time: {vendor.lead_time_weeks} weeks before
                  </div>
                </div>
                <div className="vendor-budget-badge">
                  {formatCurrencyINR(vendor.allocated_budget)}
                </div>
              </div>

              {/* Status Selector */}
              <div className="vendor-status-row">
                <label
                  htmlFor={`status-select-${vendor.id}`}
                  style={{ fontWeight: 600 }}
                >
                  Status:
                </label>
                <select
                  id={`status-select-${vendor.id}`}
                  className="vendor-status-select"
                  value={currentStatus}
                  style={{
                    color: getStatusColor(currentStatus),
                    borderColor: getStatusColor(currentStatus),
                  }}
                  onChange={(e) =>
                    handleStatusChange(
                      vendor.id,
                      e.target.value as VendorStatus
                    )
                  }
                >
                  <option value="Not started">⚪ Not started</option>
                  <option value="Contacted">🟡 Contacted</option>
                  <option value="Booked">🟢 Booked</option>
                </select>
              </div>

              {/* Advance Payment Guidance */}
              <div
                style={{
                  background: "var(--color-surface-subtle)",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                }}
              >
                <strong>Payment Schedule:</strong> {vendor.advance_payment_guidance}
              </div>

              {/* Accordions for Questions & Contracts */}
              <div className="accordion-section">
                <details>
                  <summary>
                    Key Questions to Ask ({vendor.questions_to_ask.length})
                  </summary>
                  <ul className="accordion-content" style={{ paddingLeft: "20px" }}>
                    {vendor.questions_to_ask.map((q, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>
                        {q}
                      </li>
                    ))}
                  </ul>
                </details>

                <details>
                  <summary>
                    Contract Must-Haves ({vendor.contract_must_haves.length})
                  </summary>
                  <ul className="accordion-content" style={{ paddingLeft: "20px" }}>
                    {vendor.contract_must_haves.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>
                        {c}
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
