import React, { useState } from "react";
import {
  CityTier,
  IdeasPlan,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../../types";
import { regenerateIdeas } from "../../api/client";

interface IdeasTabProps {
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

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const freshIdeas = await regenerateIdeas({
        city,
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
      {/* Header and Source Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            className={`ideas-source-badge ${
              ideasPlan.ideas_source === "gemini" ? "gemini" : "fallback"
            }`}
          >
            {ideasPlan.ideas_source === "gemini"
              ? "✨ GenAI-Personalized (Gemini)"
              : "🛡️ Culturally Curated Expert Engine"}
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Theme: <strong>{style}</strong> in <strong>{city}</strong>
          </span>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          aria-label="Regenerate ideas using AI"
        >
          {isRegenerating ? "Refreshing Ideas..." : "🔄 Refresh Ideas"}
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          style={{
            color: "var(--color-unrealistic)",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Overview Summary */}
      <div className="overview-summary-box">
        <p>{ideasPlan.overview_summary}</p>
      </div>

      <div className="ideas-card-grid">
        {/* Themes & Decor */}
        <section className="idea-card" aria-labelledby="themes-heading">
          <h3 id="themes-heading">🌺 Themes & Mandap Decor</h3>
          <ul className="idea-items-list">
            {ideasPlan.themes_and_decor.map((item, idx) => (
              <li key={idx} className="idea-item">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Catering & Menu */}
        <section className="idea-card" aria-labelledby="menu-heading">
          <h3 id="menu-heading">🍽️ Culinary & Food Spread</h3>
          <ul className="idea-items-list">
            {ideasPlan.catering_and_menu.map((item, idx) => (
              <li key={idx} className="idea-item">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Function Activities */}
        <section className="idea-card" aria-labelledby="activities-heading">
          <h3 id="activities-heading">🎉 Function Activities & Entertainment</h3>
          <ul className="idea-items-list">
            {ideasPlan.function_activities.map((item, idx) => (
              <li key={idx} className="idea-item">
                <strong>{item.function}:</strong> {item.activity}
              </li>
            ))}
          </ul>
        </section>

        {/* Guest Experience */}
        <section className="idea-card" aria-labelledby="experience-heading">
          <h3 id="experience-heading">💖 Thoughtful Guest Hospitality</h3>
          <ul className="idea-items-list">
            {ideasPlan.guest_experience_ideas.map((item, idx) => (
              <li key={idx} className="idea-item">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Money Saving Hacks */}
        <section
          className="idea-card"
          aria-labelledby="hacks-heading"
          style={{ gridColumn: "1 / -1" }}
        >
          <h3 id="hacks-heading">💰 Practical Money-Saving Hacks</h3>
          <ul
            className="idea-items-list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {ideasPlan.money_saving_hacks.map((item, idx) => (
              <li key={idx} className="idea-item">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
