import React, { useState, useEffect } from "react";
import { VendorStatus } from "../../types";
import { UsersIcon } from "../../components/common/Icons";
import { getStoredVendorStatuses, saveStoredVendorStatuses } from "../../utils/planStorage";
import { computeVendorUrgency } from "../../hooks/useOverdueCheck";
import { VendorsTabProps } from "./types";
import { VendorCard } from "./VendorCard";

export const VendorsTab: React.FC<VendorsTabProps> = ({ vendorPlan, weddingDate, today, planHash }) => {
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, VendorStatus>>({});

  useEffect(() => {
    if (planHash) {
      setVendorStatuses(getStoredVendorStatuses(planHash));
    }
  }, [planHash]);

  const handleStatusChange = (vendorId: string, status: VendorStatus) => {
    setVendorStatuses((prev) => {
      const updated = { ...prev, [vendorId]: status };
      if (planHash) {
        saveStoredVendorStatuses(planHash, updated);
      }
      return updated;
    });
  };

  const todayStr = today ? (today instanceof Date ? today.toISOString() : String(today)) : undefined;

  return (
    <div className="vendors-tab-container">
      <div className="vendors-header-banner">
        <div>
          <h2 className="vendors-section-title">
            <UsersIcon size={20} color="var(--color-primary)" /> Vendor Procurement & Checklist
          </h2>
          <p className="vendors-section-subtitle">
            Manage your booking pipeline, track payments, and verify contract requirements tailored for Indian wedding
            vendors.
          </p>
        </div>
      </div>

      <div className="vendors-grid">
        {vendorPlan.categories.map((vendor) => {
          const currentStatus: VendorStatus = vendorStatuses[vendor.id] || vendor.default_status || "Not started";
          const urgencyInfo = computeVendorUrgency(vendor.lead_time_weeks, weddingDate, todayStr);

          return (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              currentStatus={currentStatus}
              urgency={urgencyInfo.urgency}
              bookByIso={urgencyInfo.bookByIso}
              onStatusChange={handleStatusChange}
            />
          );
        })}
      </div>
    </div>
  );
};
