import React, { useState } from "react";
import { CategoryAllocation } from "../../types";
import { formatCurrencyINR, formatPercentage } from "../../utils/formatters";
import { CATEGORY_COLORS } from "../overview/types";

interface CategoryTableProps {
  allocations: CategoryAllocation[];
  totalBudget: number;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({ allocations, totalBudget }) => {
  const [displayMode, setDisplayMode] = useState<"inr" | "percentage">("inr");

  return (
    <section className="budget-table-section" aria-labelledby="category-breakdown-heading">
      <div className="table-header-bar">
        <div>
          <h3 id="category-breakdown-heading" className="section-title">
            Category Allocation Details
          </h3>
          <p className="section-subtitle">
            Calculated using the Largest Remainder (Hamilton) method. Sums to exactly {formatCurrencyINR(totalBudget)}{" "}
            with 0 rupee rounding errors.
          </p>
        </div>
        <div className="display-mode-toggle" role="group" aria-label="Display mode toggle">
          <button
            type="button"
            className={`toggle-option ${displayMode === "inr" ? "active" : ""}`}
            onClick={() => setDisplayMode("inr")}
          >
            Rupees (₹)
          </button>
          <button
            type="button"
            className={`toggle-option ${displayMode === "percentage" ? "active" : ""}`}
            onClick={() => setDisplayMode("percentage")}
          >
            Percentage (%)
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="budget-table" aria-label="Wedding budget allocations">
          <thead>
            <tr>
              <th scope="col" style={{ width: "28%" }}>
                Category
              </th>
              <th scope="col" style={{ width: "32%" }}>
                Allocation Distribution
              </th>
              <th scope="col" style={{ width: "15%", textAlign: "right" }}>
                Percentage
              </th>
              <th scope="col" style={{ width: "25%", textAlign: "right" }}>
                Amount (INR)
              </th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc) => {
              const catColor = CATEGORY_COLORS[alloc.category] || "var(--color-primary)";
              return (
                <tr key={alloc.category}>
                  <td>
                    <div className="cat-cell-content">
                      <span className="cat-color-swatch" style={{ backgroundColor: catColor }} />
                      <div>
                        <strong className="cat-name">{alloc.category}</strong>
                        <div className="cat-desc">{alloc.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="table-progress-cell">
                      <div className="table-progress-track">
                        <div
                          className="table-progress-fill"
                          style={{
                            width: `${Math.min(100, alloc.percentage * 2.5)}%`,
                            backgroundColor: catColor,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: displayMode === "percentage" ? 700 : 500 }}>
                    <span className={`value-badge ${displayMode === "percentage" ? "highlight" : ""}`}>
                      {formatPercentage(alloc.percentage)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: displayMode === "inr" ? 700 : 500 }}>
                    <span className={`value-badge ${displayMode === "inr" ? "highlight" : ""}`}>
                      {formatCurrencyINR(alloc.amount)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>
                <strong>Total Wedding Budget Allocation</strong>
              </td>
              <td style={{ textAlign: "right" }}>
                <strong>100.0%</strong>
              </td>
              <td style={{ textAlign: "right" }}>
                <strong style={{ color: "var(--color-primary)" }}>{formatCurrencyINR(totalBudget)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
