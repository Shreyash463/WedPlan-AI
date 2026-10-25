import React, { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./common/Icons";

export const Header: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("wedplan_theme");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("wedplan_theme", theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <header className="app-header" role="banner">
      <div className="header-container">
        <div className="brand-wrapper">
          {/* Celebratory Mandap & Kalash Icon in SVG */}
          <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M12 2L4 7v2h16V7l-8-5zm-6 9v7h3v-7H6zm5 0v7h2v-7h-2zm4 0v7h3v-7h-3zm-9 9h12v2H4v-2z"
            />
          </svg>
          <div className="brand-text">
            <span className="brand-title">WedPlan AI</span>
            <span className="brand-tagline">Intelligent Indian Wedding Assistant</span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-pressed={theme === "dark"}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
        </button>
      </div>
      <div className="header-gold-accent-line" />
    </header>
  );
};
