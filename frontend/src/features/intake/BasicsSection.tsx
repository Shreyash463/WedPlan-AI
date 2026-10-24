import React from "react";
import { CityTier } from "../../types";

interface BasicsSectionProps {
  coupleName: string;
  setCoupleName: (v: string) => void;
  weddingDate: string;
  setWeddingDate: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  cityTier: CityTier;
  setCityTier: (v: CityTier) => void;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  onBlur: (field: string) => void;
  validateField: (field: string) => boolean;
}

export const BasicsSection: React.FC<BasicsSectionProps> = ({
  coupleName,
  setCoupleName,
  weddingDate,
  setWeddingDate,
  city,
  setCity,
  cityTier,
  setCityTier,
  touched,
  errors,
  onBlur,
  validateField,
}) => {
  return (
    <fieldset className="form-section-fieldset">
      <legend className="section-legend">
        <span className="section-number">1</span>
        <span>Celebration Basics</span>
      </legend>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="coupleName" className="form-label">
            Couple / Event Name <span className="field-help">(Optional)</span>
          </label>
          <input
            id="coupleName"
            type="text"
            className="form-input"
            value={coupleName}
            maxLength={60}
            placeholder="e.g. Priya & Rohan"
            onChange={(e) => setCoupleName(e.target.value)}
            aria-describedby="coupleName-help"
          />
          <span id="coupleName-help" className="field-help">
            Appears on your plan and printed layout (max 60 chars)
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="weddingDate" className="form-label">
            Wedding Date <span className="required-indicator">*</span>
          </label>
          <input
            id="weddingDate"
            type="date"
            required
            className="form-input"
            value={weddingDate}
            onChange={(e) => {
              setWeddingDate(e.target.value);
              if (touched.weddingDate) validateField("weddingDate");
            }}
            onBlur={() => onBlur("weddingDate")}
            aria-invalid={!!(touched.weddingDate && errors.weddingDate)}
            aria-describedby={
              errors.weddingDate ? "weddingDate-error" : "weddingDate-help"
            }
          />
          {touched.weddingDate && errors.weddingDate ? (
            <span id="weddingDate-error" className="field-error" role="alert">
              {errors.weddingDate}
            </span>
          ) : (
            <span id="weddingDate-help" className="field-help">
              Must be in the future
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="city" className="form-label">
            Wedding City <span className="required-indicator">*</span>
          </label>
          <input
            id="city"
            type="text"
            required
            className="form-input"
            maxLength={60}
            value={city}
            placeholder="e.g. Jaipur, New Delhi, Lucknow"
            onChange={(e) => {
              setCity(e.target.value);
              if (touched.city) validateField("city");
            }}
            onBlur={() => onBlur("city")}
            aria-invalid={!!(touched.city && errors.city)}
            aria-describedby={errors.city ? "city-error" : "city-help"}
          />
          {touched.city && errors.city ? (
            <span id="city-error" className="field-error" role="alert">
              {errors.city}
            </span>
          ) : (
            <span id="city-help" className="field-help">
              Primary host city for the celebration
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="cityTier" className="form-label">
            City Classification Tier <span className="required-indicator">*</span>
          </label>
          <select
            id="cityTier"
            className="form-select"
            value={cityTier}
            onChange={(e) => setCityTier(e.target.value as CityTier)}
            aria-describedby="cityTier-help"
          >
            <option value="Metro">Metro (Delhi NCR, Mumbai, Bengaluru, Chennai, etc.)</option>
            <option value="Tier-2">Tier-2 (Jaipur, Pune, Lucknow, Chandigarh, Ahmedabad, etc.)</option>
            <option value="Tier-3">Tier-3 (Smaller cities, towns & ancestral roots)</option>
          </select>
          <span id="cityTier-help" className="field-help">
            Sets regional per-guest catering and banquet benchmarks
          </span>
        </div>
      </div>
    </fieldset>
  );
};
