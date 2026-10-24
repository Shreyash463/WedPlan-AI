import { VendorPlan } from "../../types";

export interface VendorsTabProps {
  vendorPlan: VendorPlan;
  weddingDate?: string;
  today?: Date | string;
  planHash?: string;
}

export type VendorUrgency = "overdue" | "soon" | "normal";
