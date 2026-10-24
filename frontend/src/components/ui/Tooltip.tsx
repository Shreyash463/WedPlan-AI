import React, { useState, ReactNode } from "react";

export interface TooltipProps {
  content: string;
  children: ReactNode;
  id?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  id = "tooltip-hint",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      aria-describedby={isVisible ? id : undefined}
    >
      {children}
      {isVisible && (
        <span id={id} role="tooltip" className="tooltip-bubble">
          {content}
        </span>
      )}
    </span>
  );
};
