import React, { useState } from "react";
import {
  CityTier,
  IdeasPlan,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../../types";
import { regenerateIdeas } from "../../api/client";
import {
  HeartHandshakeIcon,
  MusicIcon,
  RefreshIcon,
  SparklesIcon,
  TagIcon,
  UtensilsIcon,
} from "../common/Icons";

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
      <div className="ideas-top-bar">
        <div className="ideas-meta-badge-group">
          <span
            className={`ideas-source-badge ${
              ideasPlan.ideas_source === "gemini" ? "gemini" : "fallback"
            }`}
          >
            <SparklesIcon size={14} />
            {ideasPlan.ideas_source === "gemini"
              ? "GenAI Powered (Gemini Flash)"
              : "Culturally Curated Indian Wedding Engine"}
          </span>
          <span className="ideas-vibe-tag">
            Vibe: <strong>{style}</strong> • {city} ({cityTier})
          </span>
        </div>

        <button
          type="button"
          className="btn btn-secondary refresh-btn"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          aria-label="Refresh ideas"
        >
          <RefreshIcon size={16} className={isRegenerating ? "spinning" : ""} />
          <span>{isRegenerating ? "Refreshing Ideas..." : "Refresh Concepts"}</span>
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="ideas-error-banner">
          {errorMsg}
        </div>
      )}

      {/* Overview Narrative */}
      <div className="ideas-overview-narrative">
        <p>{ideasPlan.overview_summary}</p>
      </div>

      <div className="ideas-card-grid">
        {/* Themes & Decor */}
        <section className="idea-card" aria-labelledby="themes-heading">
          <div className="idea-card-header">
            <SparklesIcon size={18} color="var(--color-primary)" />
            <h3 id="themes-heading">Themes & Mandap Decor</h3>
          </div>
          <ul className="idea-items-list">
            {ideasPlan.themes_and_decor.map((item, idx) => (
              <li key={idx} className="idea-item">
                <span className="bullet-point">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Catering & Menu */}
        <section className="idea-card" aria-labelledby="menu-heading">
          <div className="idea-card-header">
            <UtensilsIcon size={18} color="var(--color-primary)" />
            <h3 id="menu-heading">Culinary Highlights & Stalls</h3>
          </div>
          <ul className="idea-items-list">
            {ideasPlan.catering_and_menu.map((item, idx) => (
              <li key={idx} className="idea-item">
                <span className="bullet-point">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Function Activities */}
        <section className="idea-card" aria-labelledby="activities-heading">
          <div className="idea-card-header">
            <MusicIcon size={18} color="var(--color-primary)" />
            <h3 id="activities-heading">Ceremony Activities & Entertainment</h3>
          </div>
          <ul className="idea-items-list">
            {ideasPlan.function_activities.map((item, idx) => (
              <li key={idx} className="idea-item">
                <span className="bullet-point">•</span>
                <span>
                  <strong>{item.function}:</strong> {item.activity}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Guest Experience */}
        <section className="idea-card" aria-labelledby="experience-heading">
          <div className="idea-card-header">
            <HeartHandshakeIcon size={18} color="var(--color-primary)" />
            <h3 id="experience-heading">Thoughtful Guest Hospitality</h3>
          </div>
          <ul className="idea-items-list">
            {ideasPlan.guest_experience_ideas.map((item, idx) => (
              <li key={idx} className="idea-item">
                <span className="bullet-point">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Number-Specific Money Saving Hacks */}
        <section
          className="idea-card full-width-card"
          aria-labelledby="hacks-heading"
        >
          <div className="idea-card-header">
            <TagIcon size={18} color="var(--color-primary)" />
            <h3 id="hacks-heading">Tailored Money-Saving Hacks</h3>
          </div>
          <ul className="idea-items-grid">
            {ideasPlan.money_saving_hacks.map((item, idx) => (
              <li key={idx} className="idea-hack-item">
                <span className="hack-number">{idx + 1}</span>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
