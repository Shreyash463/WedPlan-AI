import React, { useState } from "react";
import {
  CityTier,
  PlanFormInput,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../types";
import { Notice } from "./common/Notice";

interface IntakeFormProps {
  onSubmit: (formData: PlanFormInput) => void;
  isLoading: boolean;
  initialValues?: PlanFormInput;
}

const ALL_FUNCTIONS: WeddingFunction[] = [
  "Engagement",
  "Haldi",
  "Mehendi",
  "Sangeet",
  "Wedding",
  "Reception",
];

const ALL_STYLES: WeddingStyle[] = [
  "Traditional",
  "Royal/Palace",
  "Modern Minimal",
  "Destination",
  "Eco-friendly",
  "Budget-smart",
];

const ALL_PRIORITIES: Priority[] = [
  "Food",
  "Venue & Decor",
  "Photography",
  "Music & Entertainment",
  "Attire & Jewellery",
  "Guest Experience",
];

export const IntakeForm: React.FC<IntakeFormProps> = ({
  onSubmit,
  isLoading,
  initialValues,
}) => {
  // Compute default wedding date 6 months from today in YYYY-MM-DD
  const getDefaultWeddingDate = (): string => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  };

  const [coupleName, setCoupleName] = useState(initialValues?.couple_name || "");
  const [weddingDate, setWeddingDate] = useState(
    initialValues?.wedding_date || getDefaultWeddingDate()
  );
  const [city, setCity] = useState(initialValues?.city || "Jaipur");
  const [cityTier, setCityTier] = useState<CityTier>(
    initialValues?.city_tier || "Tier-2"
  );
  const [totalBudget, setTotalBudget] = useState<number>(
    initialValues?.total_budget || 2500000
  );
  const [guestCount, setGuestCount] = useState<number>(
    initialValues?.guest_count || 350
  );
  const [functions, setFunctions] = useState<WeddingFunction[]>(
    initialValues?.functions || ["Haldi", "Mehendi", "Sangeet", "Wedding"]
  );
  const [style, setStyle] = useState<WeddingStyle>(
    initialValues?.style || "Royal/Palace"
  );
  const [priorities, setPriorities] = useState<Priority[]>(
    initialValues?.priorities || ["Food", "Venue & Decor"]
  );
  const [specialRequests, setSpecialRequests] = useState(
    initialValues?.special_requests || ""
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Check if wedding date is within 14 days
  const isTightTimelineNotice = (): boolean => {
    if (!weddingDate) return false;
    const target = new Date(weddingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 14;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string): boolean => {
    const newErrors = { ...errors };

    if (field === "weddingDate" || !field) {
      if (!weddingDate) {
        newErrors.weddingDate = "Wedding date is required.";
      } else {
        const target = new Date(weddingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (target <= today) {
          newErrors.weddingDate = "Wedding date must be in the future.";
        } else {
          delete newErrors.weddingDate;
        }
      }
    }

    if (field === "city" || !field) {
      if (!city.trim() || city.trim().length < 2) {
        newErrors.city = "Please enter a valid city name (at least 2 letters).";
      } else {
        delete newErrors.city;
      }
    }

    if (field === "totalBudget" || !field) {
      if (!totalBudget || totalBudget < 50000 || totalBudget > 100000000) {
        newErrors.totalBudget =
          "Budget must be between ₹50,000 and ₹10,00,00,000 (10 Cr).";
      } else {
        delete newErrors.totalBudget;
      }
    }

    if (field === "guestCount" || !field) {
      if (!guestCount || guestCount < 10 || guestCount > 5000) {
        newErrors.guestCount = "Guest count must be between 10 and 5,000.";
      } else {
        delete newErrors.guestCount;
      }
    }

    if (field === "functions" || !field) {
      if (functions.length === 0) {
        newErrors.functions = "Please select at least one wedding function.";
      } else {
        delete newErrors.functions;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleFunction = (fn: WeddingFunction) => {
    setFunctions((prev) => {
      const next = prev.includes(fn)
        ? prev.filter((item) => item !== fn)
        : [...prev, fn];
      if (next.length === 0) {
        setErrors((e) => ({
          ...e,
          functions: "Please select at least one function.",
        }));
      } else {
        setErrors((e) => {
          const updated = { ...e };
          delete updated.functions;
          return updated;
        });
      }
      return next;
    });
  };

  const togglePriority = (p: Priority) => {
    setPriorities((prev) => {
      if (prev.includes(p)) {
        return prev.filter((item) => item !== p);
      }
      if (prev.length >= 3) {
        // Max 3 priorities allowed
        return prev;
      }
      return [...prev, p];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields touched
    setTouched({
      weddingDate: true,
      city: true,
      totalBudget: true,
      guestCount: true,
      functions: true,
    });

    const isValid = validateField("");
    if (!isValid) return;

    onSubmit({
      couple_name: coupleName.trim() || undefined,
      wedding_date: weddingDate,
      city: city.trim(),
      city_tier: cityTier,
      total_budget: Number(totalBudget),
      guest_count: Number(guestCount),
      functions,
      style,
      priorities,
      special_requests: specialRequests.trim() || undefined,
    });
  };

  return (
    <section aria-labelledby="form-heading" className="form-card">
      <div className="form-header">
        <h1 id="form-heading">Plan Your Dream Indian Wedding</h1>
        <p className="form-intro">
          Fill in your celebration details to receive an instant, AI-customized
          budget allocation, vendor checklist, and planning countdown.
        </p>
      </div>

      {isTightTimelineNotice() && (
        <Notice
          type="warning"
          title="Very Tight Timeline Notice"
        >
          Your wedding date is within 14 days! WedPlan AI will automatically
          compress your preparation roadmap and mark critical vendor bookings
          as Urgent.
        </Notice>
      )}

      {/* Screen reader live notification of form errors */}
      <div aria-live="polite" className="sr-only">
        {Object.keys(errors).length > 0 &&
          `Form has ${Object.keys(errors).length} validation errors.`}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Couple / Event Name */}
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
              Personalizes your dashboard & print plan (max 60 chars)
            </span>
          </div>

          {/* Wedding Date */}
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
              onBlur={() => handleBlur("weddingDate")}
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

          {/* City */}
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
              placeholder="e.g. Jaipur, Mumbai, Lucknow"
              onChange={(e) => {
                setCity(e.target.value);
                if (touched.city) validateField("city");
              }}
              onBlur={() => handleBlur("city")}
              aria-invalid={!!(touched.city && errors.city)}
              aria-describedby={errors.city ? "city-error" : "city-help"}
            />
            {touched.city && errors.city ? (
              <span id="city-error" className="field-error" role="alert">
                {errors.city}
              </span>
            ) : (
              <span id="city-help" className="field-help">
                City where the primary celebrations take place
              </span>
            )}
          </div>

          {/* City Tier */}
          <div className="form-group">
            <label htmlFor="cityTier" className="form-label">
              City Tier <span className="required-indicator">*</span>
            </label>
            <select
              id="cityTier"
              className="form-select"
              value={cityTier}
              onChange={(e) => setCityTier(e.target.value as CityTier)}
              aria-describedby="cityTier-help"
            >
              <option value="Metro">Metro (Mumbai, Delhi NCR, Bengaluru, etc.)</option>
              <option value="Tier-2">Tier-2 (Jaipur, Pune, Lucknow, Chandigarh, etc.)</option>
              <option value="Tier-3">Tier-3 (Smaller cities, towns & ancestral venues)</option>
            </select>
            <span id="cityTier-help" className="field-help">
              Calibrates standard per-guest catering & venue benchmarks
            </span>
          </div>

          {/* Total Budget */}
          <div className="form-group">
            <label htmlFor="totalBudget" className="form-label">
              Total Budget (INR ₹) <span className="required-indicator">*</span>
            </label>
            <input
              id="totalBudget"
              type="number"
              required
              min={50000}
              max={100000000}
              step={25000}
              className="form-input"
              value={totalBudget}
              onChange={(e) => {
                setTotalBudget(Number(e.target.value));
                if (touched.totalBudget) validateField("totalBudget");
              }}
              onBlur={() => handleBlur("totalBudget")}
              aria-invalid={!!(touched.totalBudget && errors.totalBudget)}
              aria-describedby={
                errors.totalBudget ? "totalBudget-error" : "totalBudget-help"
              }
            />
            {touched.totalBudget && errors.totalBudget ? (
              <span id="totalBudget-error" className="field-error" role="alert">
                {errors.totalBudget}
              </span>
            ) : (
              <span id="totalBudget-help" className="field-help">
                ₹50,000 to ₹10,00,00,000 (Allocated to 100% without rounding loss)
              </span>
            )}
          </div>

          {/* Guest Count */}
          <div className="form-group">
            <label htmlFor="guestCount" className="form-label">
              Guest Count <span className="required-indicator">*</span>
            </label>
            <input
              id="guestCount"
              type="number"
              required
              min={10}
              max={5000}
              step={10}
              className="form-input"
              value={guestCount}
              onChange={(e) => {
                setGuestCount(Number(e.target.value));
                if (touched.guestCount) validateField("guestCount");
              }}
              onBlur={() => handleBlur("guestCount")}
              aria-invalid={!!(touched.guestCount && errors.guestCount)}
              aria-describedby={
                errors.guestCount ? "guestCount-error" : "guestCount-help"
              }
            />
            {touched.guestCount && errors.guestCount ? (
              <span id="guestCount-error" className="field-error" role="alert">
                {errors.guestCount}
              </span>
            ) : (
              <span id="guestCount-help" className="field-help">
                Min 10, max 5,000 attendees
              </span>
            )}
          </div>

          {/* Wedding Style / Vibe */}
          <div className="form-group">
            <label htmlFor="style" className="form-label">
              Style / Vibe <span className="required-indicator">*</span>
            </label>
            <select
              id="style"
              className="form-select"
              value={style}
              onChange={(e) => setStyle(e.target.value as WeddingStyle)}
              aria-describedby="style-help"
            >
              {ALL_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span id="style-help" className="field-help">
              Tailors budget weights, decor concepts, and themes
            </span>
          </div>

          {/* Celebrated Functions */}
          <div className="form-group form-group-full">
            <span id="functions-label" className="form-label">
              Celebrated Functions <span className="required-indicator">*</span>
            </span>
            <div
              role="group"
              aria-labelledby="functions-label"
              className="chips-group"
            >
              {ALL_FUNCTIONS.map((fn) => {
                const isSelected = functions.includes(fn);
                return (
                  <button
                    key={fn}
                    type="button"
                    className={`chip-btn ${isSelected ? "selected" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleFunction(fn)}
                  >
                    <span aria-hidden="true">{isSelected ? "✓" : "+"}</span>
                    {fn}
                  </button>
                );
              })}
            </div>
            {errors.functions && (
              <span id="functions-error" className="field-error" role="alert">
                {errors.functions}
              </span>
            )}
          </div>

          {/* Top 3 Priorities */}
          <div className="form-group form-group-full">
            <span id="priorities-label" className="form-label">
              Top 3 Priorities{" "}
              <span className="field-help">(Choose up to 3)</span>
            </span>
            <div
              role="group"
              aria-labelledby="priorities-label"
              className="chips-group"
            >
              {ALL_PRIORITIES.map((p) => {
                const isSelected = priorities.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`chip-btn ${isSelected ? "selected" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => togglePriority(p)}
                  >
                    <span aria-hidden="true">{isSelected ? "★" : "☆"}</span>
                    {p}
                  </button>
                );
              })}
            </div>
            <span className="field-help">
              {priorities.length} / 3 priorities selected. These receive boosted
              budget weights.
            </span>
          </div>

          {/* Special Requests */}
          <div className="form-group form-group-full">
            <label htmlFor="specialRequests" className="form-label">
              Special Requests & Traditions{" "}
              <span className="field-help">(Optional, max 300 chars)</span>
            </label>
            <textarea
              id="specialRequests"
              rows={2}
              className="form-textarea"
              maxLength={300}
              placeholder="e.g. Pure Jain vegetarian menu, eco-friendly varmalas, sunset outdoor ceremony, Punjabi Baraat"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              aria-describedby="specialRequests-help"
            />
            <span id="specialRequests-help" className="field-help">
              {300 - specialRequests.length} characters remaining
            </span>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Crafting Your Wedding Plan...</span>
              </>
            ) : (
              <span>Generate Wedding Plan ✨</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
