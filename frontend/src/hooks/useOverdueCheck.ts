import { useMemo } from "react";
import { VendorCategoryItem } from "../types";

export type VendorUrgency = "overdue" | "soon" | "normal";

export interface VendorUrgencyInfo {
  bookByIso: string | null;
  urgency: VendorUrgency;
  diffDays: number | null;
}

export function computeVendorUrgency(
  leadTimeWeeks: number,
  weddingDate?: string,
  today?: string
): VendorUrgencyInfo {
  if (!weddingDate) {
    return { bookByIso: null, urgency: "normal", diffDays: null };
  }
  try {
    const parts = weddingDate.split("-");
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
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
        return { bookByIso, urgency: "overdue", diffDays };
      } else if (diffDays <= 14) {
        return { bookByIso, urgency: "soon", diffDays };
      } else {
        return { bookByIso, urgency: "normal", diffDays };
      }
    }
  } catch {
    return { bookByIso: null, urgency: "normal", diffDays: null };
  }
  return { bookByIso: null, urgency: "normal", diffDays: null };
}

export function useOverdueCheck(
  vendors: VendorCategoryItem[],
  weddingDate?: string,
  today?: string
) {
  return useMemo(() => {
    const overdueList: Array<VendorCategoryItem & { urgencyInfo: VendorUrgencyInfo }> = [];
    const soonList: Array<VendorCategoryItem & { urgencyInfo: VendorUrgencyInfo }> = [];

    vendors.forEach((v) => {
      const urgencyInfo = computeVendorUrgency(v.lead_time_weeks, weddingDate, today);
      if (urgencyInfo.urgency === "overdue") {
        overdueList.push({ ...v, urgencyInfo });
      } else if (urgencyInfo.urgency === "soon") {
        soonList.push({ ...v, urgencyInfo });
      }
    });

    return {
      overdueList,
      soonList,
      hasOverdue: overdueList.length > 0,
      hasSoon: soonList.length > 0,
    };
  }, [vendors, weddingDate, today]);
}
