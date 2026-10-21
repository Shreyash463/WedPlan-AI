import React, { useState } from "react";
import { PlanFormInput, PlanResponse } from "./types";
import { createPlan, ApiClientError } from "./api/client";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { SkipLink } from "./components/SkipLink";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { IntakeForm } from "./components/IntakeForm";
import { Dashboard } from "./components/Dashboard";
import { Notice } from "./components/common/Notice";

export const App: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useLocalStorage<PlanResponse | null>(
    "wedplan_active_plan",
    null
  );
  const [activeFormData, setActiveFormData] = useLocalStorage<PlanFormInput | null>(
    "wedplan_form_data",
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: PlanFormInput) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await createPlan(formData);
      setCurrentPlan(response);
      setActiveFormData(formData);
      // Scroll to top of main content
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setApiError(err.message);
      } else {
        setApiError(
          "An unexpected error occurred while compiling your wedding plan. Please check your connection and retry."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDetails = () => {
    setCurrentPlan(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <SkipLink />
      <Header />

      <main id="main-content" className="main-content" role="main">
        {/* Screen Reader Live Announcement */}
        <div className="sr-only" aria-live="polite">
          {isLoading && "Creating your personalized wedding plan..."}
          {currentPlan &&
            `Wedding plan successfully generated for ${
              currentPlan.overview.couple_name || "your celebration"
            }.`}
        </div>

        {apiError && (
          <Notice type="error" title="Submission Error">
            {apiError}
          </Notice>
        )}

        {!currentPlan ? (
          <IntakeForm
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            initialValues={activeFormData || undefined}
          />
        ) : (
          <Dashboard
            initialPlan={currentPlan}
            formData={activeFormData!}
            onEditDetails={handleEditDetails}
          />
        )}
      </main>

      <Footer />
    </>
  );
};

export default App;
