import React from "react";

interface IdeaItemProps {
  text: string;
}

export const IdeaItem: React.FC<IdeaItemProps> = ({ text }) => {
  const colonIndex = text.indexOf(":");
  let content = <span>{text}</span>;

  if (colonIndex > 0 && colonIndex <= 50) {
    const label = text.slice(0, colonIndex).trim();
    const rest = text.slice(colonIndex + 1).trim();
    content = (
      <span>
        <strong>{label}:</strong> {rest}
      </span>
    );
  }

  return (
    <li className="idea-item">
      <span className="bullet-point" aria-hidden="true">
        •
      </span>
      {content}
    </li>
  );
};
