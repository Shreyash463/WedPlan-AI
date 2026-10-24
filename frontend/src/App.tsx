import React from "react";
import { PlanFormInput } from "./types";
import { SkipLink } from "./components/SkipLink";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { IntakeForm } from "./components/IntakeForm";
import { Dashboard } from "./components/Dashboard";
import { Notice } from "./components/common/Notice";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { usePlan } from "./hooks/usePlan";

export const App: React.FC = () => {
  const {
    currentPlan,
    formData,
    isLoading,
    apiError,
    submitPlan,
    editDetails,
  } = usePlan();

  const handleFormSubmit = async (input: PlanFormInput) => {
    try {
      await submitPlan(input);
    } catch {
      // Error is stored in apiError state
    }
  };

  return (
    <ErrorBoundary>
      <SkipLink />
      <Header />

      <main id="main-content" className="main-content" role="main">
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
            initialValues={formData || undefined}
          />
        ) : (
          <Dashboard
            initialPlan={currentPlan}
            formData={formData!}
            onEditDetails={editDetails}
          />
        )}
      </main>

      <Footer />
    </ErrorBoundary>
  );
};

export default App;
