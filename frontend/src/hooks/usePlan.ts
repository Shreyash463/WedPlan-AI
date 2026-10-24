import { useState, useCallback } from "react";
import { PlanFormInput, PlanResponse } from "../types";
import { createPlan, ApiClientError } from "../api/client";
import { useLocalStorage } from "./useLocalStorage";

export function usePlan() {
  const [currentPlan, setCurrentPlan] = useLocalStorage<PlanResponse | null>(
    "wedplan_active_plan",
    null
  );
  const [formData, setFormData] = useLocalStorage<PlanFormInput | null>(
    "wedplan_form_data",
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const submitPlan = useCallback(
    async (input: PlanFormInput) => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await createPlan(input);
        setCurrentPlan(response);
        setFormData(input);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return response;
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          setApiError(err.message);
        } else {
          setApiError(
            "An unexpected error occurred while compiling your wedding plan. Please check your connection and retry."
          );
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentPlan, setFormData]
  );

  const editDetails = useCallback(() => {
    setCurrentPlan(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setCurrentPlan]);

  return {
    currentPlan,
    setCurrentPlan,
    formData,
    setFormData,
    isLoading,
    apiError,
    submitPlan,
    editDetails,
  };
}
