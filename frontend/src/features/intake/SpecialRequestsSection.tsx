import React from "react";

interface SpecialRequestsSectionProps {
  specialRequests: string;
  setSpecialRequests: (v: string) => void;
}

export const SpecialRequestsSection: React.FC<SpecialRequestsSectionProps> = ({
  specialRequests,
  setSpecialRequests,
}) => {
  return (
    <fieldset className="form-section-fieldset">
      <legend className="section-legend">
        <span className="section-number">4</span>
        <span>Special Requests & Traditions</span>
      </legend>

      <div className="form-group form-group-full">
        <label htmlFor="specialRequests" className="form-label">
          Unique Requests or Traditions <span className="field-help">(Optional, max 300 chars)</span>
        </label>
        <textarea
          id="specialRequests"
          rows={3}
          className="form-textarea"
          maxLength={300}
          placeholder="e.g. Pure Jain catering with zero root vegetables, sunset outdoor lawn pheras, eco-friendly seed-paper favors, Punjabi live dhol welcome"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          aria-describedby="specialRequests-help"
        />
        <span id="specialRequests-help" className="field-help">
          {300 - specialRequests.length} characters remaining
        </span>
      </div>
    </fieldset>
  );
};
