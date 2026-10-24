import {
  PlanFormInput,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../../types";

export interface IntakeFormProps {
  onSubmit: (formData: PlanFormInput) => void;
  isLoading: boolean;
  initialValues?: PlanFormInput;
}

export const ALL_FUNCTIONS: WeddingFunction[] = [
  "Engagement",
  "Haldi",
  "Mehendi",
  "Sangeet",
  "Wedding",
  "Reception",
];

export const ALL_STYLES: WeddingStyle[] = [
  "Traditional",
  "Royal/Palace",
  "Modern Minimal",
  "Destination",
  "Eco-friendly",
  "Budget-smart",
];

export const ALL_PRIORITIES: Priority[] = [
  "Food",
  "Venue & Decor",
  "Photography",
  "Music & Entertainment",
  "Attire & Jewellery",
  "Guest Experience",
];
