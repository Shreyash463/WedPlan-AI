import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="app-header" role="banner">
      <div className="header-container">
        <div className="brand-wrapper">
          {/* Celebratory Mandap & Kalash Icon in SVG */}
          <svg
            className="brand-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M12 2L4 7v2h16V7l-8-5zm-6 9v7h3v-7H6zm5 0v7h2v-7h-2zm4 0v7h3v-7h-3zm-9 9h12v2H4v-2z"
            />
          </svg>
          <div>
            <span className="brand-title">WedPlan AI</span>
            <span className="brand-tagline">
              Intelligent Indian Wedding Assistant
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
