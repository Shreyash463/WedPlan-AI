export type CityTier = "Metro" | "Tier-2" | "Tier-3";

export type WeddingStyle =
  | "Traditional"
  | "Royal/Palace"
  | "Modern Minimal"
  | "Destination"
  | "Eco-friendly"
  | "Budget-smart";

export type WeddingFunction =
  | "Engagement"
  | "Haldi"
  | "Mehendi"
  | "Sangeet"
  | "Wedding"
  | "Reception";

export type Priority =
  | "Food"
  | "Venue & Decor"
  | "Photography"
  | "Music & Entertainment"
  | "Attire & Jewellery"
  | "Guest Experience";

export type BudgetHealth = "Healthy" | "Tight" | "Unrealistic";

export type TaskPriority = "Urgent" | "High" | "Normal";

export type VendorStatus = "Not started" | "Contacted" | "Booked";

export interface PlanFormInput {
  couple_name?: string;
  wedding_date: string;
  city: string;
  city_tier: CityTier;
  total_budget: number;
  guest_count: number;
  functions: WeddingFunction[];
  style: WeddingStyle;
  priorities: Priority[];
  special_requests?: string;
}

export interface CategoryAllocation {
  category: string;
  amount: number;
  percentage: number;
  description: string;
}

export interface BudgetPlan {
  total_budget: number;
  guest_count: number;
  cost_per_guest: number;
  health_status: BudgetHealth;
  health_description: string;
  allocations: CategoryAllocation[];
  warnings: string[];
  suggestions: string[];
}

export const CANONICAL_PHASES: string[] = [
  "6+ Months",
  "5-6 Months",
  "3-4 Months",
  "2 Months",
  "1 Month",
  "2 Weeks",
  "Final Week",
  "Final 72 Hours",
  "Wedding Day",
  "After Wedding",
];

export interface TimelineTask {
  id: string;
  title: string;
  phase: string;
  due_date: string;
  priority: TaskPriority;
  related_vendor_category?: string;
  description: string;
  is_overdue_standard?: boolean;
}

export interface TimelinePlan {
  days_remaining: number;
  is_tight_timeline: boolean;
  phases: string[];
  tasks: TimelineTask[];
}

export interface VendorCategoryItem {
  id: string;
  name: string;
  allocated_budget: number;
  lead_time_weeks: number;
  advance_payment_guidance: string;
  questions_to_ask: string[];
  contract_must_haves: string[];
  default_status: VendorStatus;
}

export interface VendorPlan {
  categories: VendorCategoryItem[];
}

export interface FunctionActivity {
  function: string;
  activity: string;
}

export interface IdeasPlan {
  overview_summary: string;
  themes_and_decor: string[];
  catering_and_menu: string[];
  function_activities: FunctionActivity[];
  guest_experience_ideas: string[];
  money_saving_hacks: string[];
  ideas_source: "gemini" | "fallback";
}

export interface OverviewData {
  couple_name?: string;
  wedding_date: string;
  city: string;
  city_tier: string;
  guest_count: number;
  total_budget: number;
  cost_per_guest: number;
  days_remaining: number;
  is_tight_timeline: boolean;
  health_status: BudgetHealth;
  summary: string;
  key_warnings: string[];
  tier_min_healthy?: number;
  tier_min_tight?: number;
}

export interface PlanResponse {
  overview: OverviewData;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  vendors: VendorPlan;
  ideas: IdeasPlan;
  generated_at: string;
  disclaimer: string;
}

export interface RecalculateResponse {
  budget: BudgetPlan;
  timeline: TimelinePlan;
  vendors: VendorPlan;
  days_remaining: number;
  is_tight_timeline: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
