import React from "react";
import { BudgetPlan } from "../../types";
import {
  formatCurrencyCompactINR,
  formatCurrencyINR,
  formatPercentage,
} from "../../utils/formatters";
import { RupeeIcon } from "../../components/common/Icons";
import { CATEGORY_COLORS } from "./types";

interface BudgetDonutPreviewProps {
  budget: BudgetPlan;
  totalBudget: number;
}

export const BudgetDonutPreview: React.FC<BudgetDonutPreviewProps> = ({
  budget,
  totalBudget,
}) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const donutSlices = budget.allocations.map((item) => {
    const sliceLength = (item.percentage / 100) * circumference;
    const strokeDasharray = `${sliceLength} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle;
    accumulatedAngle += sliceLength;
    const color = CATEGORY_COLORS[item.category] || "#999999";

    return {
      category: item.category,
      percentage: item.percentage,
      amount: item.amount,
      color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <section className="dashboard-card donut-chart-card" aria-labelledby="budget-breakdown-heading">
      <h2 id="budget-breakdown-heading" className="card-heading">
        <RupeeIcon size={20} color="var(--color-primary)" />
        Budget Allocation Breakdown
      </h2>

      <div className="donut-wrapper">
        <svg width="220" height="220" viewBox="0 0 220 220" className="donut-svg" role="img" aria-label="Budget allocation chart">
          <g transform="rotate(-90 110 110)">
            {donutSlices.map((slice) => (
              <circle
                key={slice.category}
                cx="110"
                cy="110"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth="28"
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="donut-segment"
              />
            ))}
          </g>
          <text x="110" y="105" textAnchor="middle" className="donut-center-total">
            {formatCurrencyCompactINR(totalBudget)}
          </text>
          <text x="110" y="125" textAnchor="middle" className="donut-center-sub">
            Total Budget
          </text>
        </svg>

        <table className="sr-only">
          <caption>Budget allocation percentages and amounts</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Percentage</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {budget.allocations.map((a) => (
              <tr key={a.category}>
                <td>{a.category}</td>
                <td>{formatPercentage(a.percentage)}</td>
                <td>{formatCurrencyINR(a.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="donut-legend">
          {donutSlices.map((slice) => (
            <div key={slice.category} className="legend-row">
              <span className="legend-dot" style={{ backgroundColor: slice.color }} />
              <span className="legend-category">{slice.category}</span>
              <span className="legend-pct">{formatPercentage(slice.percentage)}</span>
              <span className="legend-amount">{formatCurrencyCompactINR(slice.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
