import React from "react";
import { IdeasPlan } from "../../types";
import {
  HeartHandshakeIcon,
  MusicIcon,
  SparklesIcon,
  TagIcon,
  UtensilsIcon,
} from "../../components/common/Icons";
import { IdeaItem } from "./IdeaItem";

interface IdeasGridProps {
  ideasPlan: IdeasPlan;
}

export const IdeasGrid: React.FC<IdeasGridProps> = ({ ideasPlan }) => {
  return (
    <div className="ideas-card-grid">
      <section className="idea-card" aria-labelledby="themes-heading">
        <div className="idea-card-header">
          <SparklesIcon size={18} color="var(--color-primary)" />
          <h3 id="themes-heading">Themes & Mandap Decor</h3>
        </div>
        <ul className="idea-items-list">
          {ideasPlan.themes_and_decor.map((item, idx) => (
            <IdeaItem key={idx} text={item} />
          ))}
        </ul>
      </section>

      <section className="idea-card" aria-labelledby="menu-heading">
        <div className="idea-card-header">
          <UtensilsIcon size={18} color="var(--color-primary)" />
          <h3 id="menu-heading">Culinary Highlights & Stalls</h3>
        </div>
        <ul className="idea-items-list">
          {ideasPlan.catering_and_menu.map((item, idx) => (
            <IdeaItem key={idx} text={item} />
          ))}
        </ul>
      </section>

      <section className="idea-card" aria-labelledby="activities-heading">
        <div className="idea-card-header">
          <MusicIcon size={18} color="var(--color-primary)" />
          <h3 id="activities-heading">Ceremony Activities & Rituals</h3>
        </div>
        <ul className="idea-items-list">
          {ideasPlan.function_activities.map((item, idx) => (
            <li key={idx} className="idea-item">
              <span className="bullet-point" aria-hidden="true">•</span>
              <span>
                <strong>{item.function}:</strong> {item.activity}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="idea-card" aria-labelledby="hospitality-heading">
        <div className="idea-card-header">
          <HeartHandshakeIcon size={18} color="var(--color-primary)" />
          <h3 id="hospitality-heading">Guest Hospitality & Touches</h3>
        </div>
        <ul className="idea-items-list">
          {ideasPlan.guest_experience_ideas.map((item, idx) => (
            <IdeaItem key={idx} text={item} />
          ))}
        </ul>
      </section>

      <section className="idea-card money-hacks-card" aria-labelledby="savings-heading">
        <div className="idea-card-header">
          <TagIcon size={18} color="#15803D" />
          <h3 id="savings-heading">Smart Cost-Saving Hacks</h3>
        </div>
        <ul className="idea-items-list">
          {ideasPlan.money_saving_hacks.map((item, idx) => (
            <IdeaItem key={idx} text={item} />
          ))}
        </ul>
        <p className="savings-estimate-note">Savings are rough estimates.</p>
      </section>
    </div>
  );
};
