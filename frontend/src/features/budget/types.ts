import { BudgetPlan, CityTier, Priority, WeddingFunction, WeddingStyle } from "../../types";

export interface BudgetTabProps {
  budgetPlan: BudgetPlan;
  originalBudget?: number;
  city: string;
  cityTier: CityTier;
  weddingDate: string;
  functions: WeddingFunction[];
  style: WeddingStyle;
  initialPriorities: Priority[];
  onBudgetUpdated: (updatedPlan: BudgetPlan) => void;
}

export const ALL_PRIORITIES: Priority[] = [
  "Food",
  "Venue & Decor",
  "Photography",
  "Music & Entertainment",
  "Attire & Jewellery",
  "Guest Experience",
];
