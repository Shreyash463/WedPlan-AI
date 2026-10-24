import { parseNumericDigits } from "../../utils/formatters";

export interface IntakeValidationInput {
  weddingDate: string;
  city: string;
  budgetString: string;
  guestsString: string;
  functions: string[];
}

export function validateIntakeForm(
  input: IntakeValidationInput,
  currentErrors: Record<string, string>,
  fieldToValidate?: string
): Record<string, string> {
  const next = { ...currentErrors };

  if (fieldToValidate === "weddingDate" || !fieldToValidate) {
    if (!input.weddingDate) {
      next.weddingDate = "Wedding date is required.";
    } else {
      const target = new Date(input.weddingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (target <= today) {
        next.weddingDate = "Wedding date must be strictly in the future.";
      } else {
        delete next.weddingDate;
      }
    }
  }

  if (fieldToValidate === "city" || !fieldToValidate) {
    if (!input.city.trim() || input.city.trim().length < 2) {
      next.city = "Please enter a valid city name (at least 2 letters).";
    } else {
      delete next.city;
    }
  }

  if (fieldToValidate === "totalBudget" || !fieldToValidate) {
    const b = parseNumericDigits(input.budgetString);
    if (b === null) {
      next.totalBudget = "Total budget is required.";
    } else if (b < 50000 || b > 100000000) {
      next.totalBudget = "Budget must be between ₹50,000 and ₹10,00,00,000 (10 Cr).";
    } else {
      delete next.totalBudget;
    }
  }

  if (fieldToValidate === "guestCount" || !fieldToValidate) {
    const g = parseNumericDigits(input.guestsString);
    if (g === null) {
      next.guestCount = "Guest count is required.";
    } else if (g < 10 || g > 5000) {
      next.guestCount = "Guest count must be between 10 and 5,000.";
    } else {
      delete next.guestCount;
    }
  }

  if (fieldToValidate === "functions" || !fieldToValidate) {
    if (input.functions.length === 0) {
      next.functions = "Please select at least one wedding function.";
    } else {
      delete next.functions;
    }
  }

  return next;
}
