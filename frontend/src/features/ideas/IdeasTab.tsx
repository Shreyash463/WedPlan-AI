import React, { useState } from "react";
import { regenerateIdeas } from "../../api/client";
import { InfoIcon } from "../../components/common/Icons";
import { capitalizeCity, formatCurrencyINR } from "../../utils/formatters";
import { IdeasTabProps } from "./types";
import { IdeasTopBar } from "./IdeasTopBar";
import { IdeasGrid } from "./IdeasGrid";

export const IdeasTab: React.FC<IdeasTabProps> = ({
  ideasPlan,
  city,
  cityTier,
  totalBudget,
  guestCount,
  functions,
  style,
  priorities,
  specialRequests,
  onIdeasUpdated,
}) => {
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanCity = capitalizeCity(city);
  const perGuest = Math.floor(totalBudget / Math.max(guestCount, 1));
  const healthyMin = cityTier === "Metro" ? 2500 : cityTier === "Tier-2" ? 1800 : 1200;
  const inferredBand =
    ideasPlan.budget_band ||
    (style === "Budget-smart" || perGuest < healthyMin
      ? "Tight"
      : perGuest >= Math.floor(healthyMin * 1.8)
      ? "Premium"
      : "Comfortable");

  const budgetBandText =
    ideasPlan.budget_band_note ||
    `Ideas are matched to your ${formatCurrencyINR(perGuest)} per-guest budget (${inferredBand}) and your ${style} vibe.`;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const freshIdeas = await regenerateIdeas({
        city: cleanCity,
        city_tier: cityTier,
        total_budget: totalBudget,
        guest_count: guestCount,
        functions,
        style,
        priorities,
        special_requests: specialRequests,
      });
      onIdeasUpdated(freshIdeas);
    } catch {
      setErrorMsg("Failed to refresh ideas. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="ideas-container">
      <IdeasTopBar
        ideasSource={ideasPlan.ideas_source}
        style={style}
        cleanCity={cleanCity}
        cityTier={cityTier}
        isRegenerating={isRegenerating}
        onRegenerate={handleRegenerate}
      />

      <div className="ideas-budget-band-card" role="note" aria-label="Budget band alignment">
        <div className="band-icon-wrap">
          <InfoIcon size={18} color="var(--color-primary)" />
        </div>
        <p className="band-text">{budgetBandText}</p>
      </div>

      {errorMsg && (
        <div role="alert" className="ideas-error-banner">
          {errorMsg}
        </div>
      )}

      <div className="ideas-overview-narrative">
        <p>{ideasPlan.overview_summary}</p>
      </div>

      <IdeasGrid ideasPlan={ideasPlan} />
    </div>
  );
};
