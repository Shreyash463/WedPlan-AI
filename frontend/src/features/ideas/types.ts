import {
  CityTier,
  IdeasPlan,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../../types";

export interface IdeasTabProps {
  ideasPlan: IdeasPlan;
  city: string;
  cityTier: CityTier;
  totalBudget: number;
  guestCount: number;
  functions: WeddingFunction[];
  style: WeddingStyle;
  priorities: Priority[];
  specialRequests?: string;
  onIdeasUpdated: (updatedIdeas: IdeasPlan) => void;
}
