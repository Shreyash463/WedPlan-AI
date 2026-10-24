import {
  BudgetPlan,
  OverviewData,
  TimelinePlan,
  VendorPlan,
  WeddingFunction,
} from "../../types";

export interface OverviewTabProps {
  overview: OverviewData;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  functions: WeddingFunction[];
  vendors?: VendorPlan;
  weddingDate?: string;
  today?: Date | string;
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  disclaimer: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Venue": "#800020",
  "Catering": "#C04000",
  "Decor & Florals": "#D4AF37",
  "Photography & Video": "#2E5B88",
  "Attire & Jewellery": "#8E3B68",
  "Music & Entertainment": "#E07A5F",
  "Invitations & Stationery": "#81B29A",
  "Makeup & Mehendi": "#DDA15E",
  "Logistics, Transport & Stay": "#3D405B",
  "Contingency": "#6C757D",
};
