import React, { useState } from "react";
import { VendorCategoryItem } from "../../types";
import { AlertTriangleIcon, InfoIcon } from "../../components/common/Icons";

interface SmartAlertsProps {
  effectiveWarnings: string[];
  suggestions: string[];
  sortedOverdueVendors: VendorCategoryItem[];
}

export const SmartAlerts: React.FC<SmartAlertsProps> = ({ effectiveWarnings, suggestions, sortedOverdueVendors }) => {
  const [isOverdueExpanded, setIsOverdueExpanded] = useState<boolean>(false);

  if (effectiveWarnings.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <section className="dashboard-card alerts-card" aria-labelledby="smart-alerts-heading">
      <div className="card-header-row">
        <h2 id="smart-alerts-heading" className="card-heading">
          <AlertTriangleIcon size={20} color="var(--color-accent-gold)" />
          Smart Planner Alerts & Guidance
        </h2>
      </div>

      {effectiveWarnings.length > 0 && (
        <div className="alerts-group">
          <h3 className="alerts-subheading">Important Considerations</h3>
          <ul className="alerts-list">
            {effectiveWarnings.map((warn, idx) => {
              const isOverdueWarn =
                warn.includes("past their standard booking window") ||
                warn.startsWith("Book these vendors immediately:");

              return (
                <li key={idx} className="alert-item warning">
                  <div className="alert-badge-group">
                    <AlertTriangleIcon size={16} color="currentColor" />
                    <span className="alert-severity-tag">Warning</span>
                  </div>
                  <div className="alert-content-group">
                    <span className="alert-text">{warn}</span>
                    {isOverdueWarn && sortedOverdueVendors.length > 0 && (
                      <div className="overdue-collapsible-wrapper">
                        <button
                          type="button"
                          className="btn-collapsible-overdue"
                          aria-expanded={isOverdueExpanded}
                          onClick={() => setIsOverdueExpanded((prev) => !prev)}
                        >
                          {isOverdueExpanded
                            ? "Hide overdue vendors list"
                            : `Show all ${sortedOverdueVendors.length} overdue vendors`}
                        </button>
                        {isOverdueExpanded && (
                          <ul className="overdue-vendors-sublist" aria-label="All overdue vendors">
                            {sortedOverdueVendors.map((v) => (
                              <li key={v.id} className="overdue-vendor-chip">
                                <span className="overdue-chip-name">{v.name}</span>
                                <span className="overdue-chip-weeks">({v.lead_time_weeks}w lead time)</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="alerts-group" style={{ marginTop: "12px" }}>
          <h3 className="alerts-subheading">Actionable Optimization Tips</h3>
          <ul className="alerts-list">
            {suggestions.map((sug, idx) => (
              <li key={idx} className="alert-item tip">
                <div className="alert-badge-group">
                  <InfoIcon size={16} color="currentColor" />
                  <span className="alert-severity-tag">Tip</span>
                </div>
                <span className="alert-text">{sug}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
