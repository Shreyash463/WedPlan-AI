import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-container">
        <p>
          WedPlan AI &copy; {new Date().getFullYear()} &bull; Built for Indian Wedding Celebrations with Cultural
          Intelligence.
        </p>
        <p className="footer-disclaimer">
          All financial figures, timelines, and vendor lead times are expert estimates for planning purposes.
        </p>
      </div>
    </footer>
  );
};
