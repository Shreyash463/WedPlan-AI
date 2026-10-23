import React, { useState } from "react";
import {
  CityTier,
  PlanFormInput,
  Priority,
  WeddingFunction,
  WeddingStyle,
} from "../types";
import {
  formatCoupleName,
  formatCurrencyINR,
  formatDigitsIndianGrouping,
  formatNumberToIndianWords,
  parseNumericDigits,
  sanitizeDigitsOnly,
} from "../utils/formatters";
import { Notice } from "./common/Notice";
import {
  CheckIcon,
  PlusIcon,
  SparklesIcon,
} from "./common/Icons";

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
  const [budgetString, setBudgetString] = useState<string>(
    initialValues?.total_budget
      ? formatDigitsIndianGrouping(String(initialValues.total_budget))
      : "25,00,000"
  );
  const [guestsString, setGuestsString] = useState<string>(
    initialValues?.guest_count ? String(initialValues.guest_count) : "350"
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

  // Validation errors & touched states
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
          newErrors.weddingDate = "Wedding date must be strictly in the future.";
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
      const bNum = parseNumericDigits(budgetString);
      if (bNum === null) {
        newErrors.totalBudget = "Total budget is required.";
      } else if (bNum < 50000 || bNum > 100000000) {
        newErrors.totalBudget =
          "Budget must be between ₹50,000 and ₹10,00,00,000 (10 Cr).";
      } else {
        delete newErrors.totalBudget;
      }
    }

    if (field === "guestCount" || !field) {
      const gNum = parseNumericDigits(guestsString);
      if (gNum === null) {
        newErrors.guestCount = "Guest count is required.";
      } else if (gNum < 10 || gNum > 5000) {
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

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = sanitizeDigitsOnly(e.target.value, 10);
    setBudgetString(digits);
    if (touched.totalBudget) {
      const bNum = parseNumericDigits(digits);
      setErrors((prev) => {
        const next = { ...prev };
        if (bNum === null) {
          next.totalBudget = "Total budget is required.";
        } else if (bNum < 50000 || bNum > 100000000) {
          next.totalBudget = "Budget must be between ₹50,000 and ₹10,00,00,000 (10 Cr).";
        } else {
          delete next.totalBudget;
        }
        return next;
      });
    }
  };

  const handleBudgetBlur = () => {
    setTouched((prev) => ({ ...prev, totalBudget: true }));
    if (budgetString.trim()) {
      setBudgetString(formatDigitsIndianGrouping(budgetString));
    }
    validateField("totalBudget");
  };

  const handleGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = sanitizeDigitsOnly(e.target.value, 5);
    setGuestsString(digits);
    if (touched.guestCount) {
      const gNum = parseNumericDigits(digits);
      setErrors((prev) => {
        const next = { ...prev };
        if (gNum === null) {
          next.guestCount = "Guest count is required.";
        } else if (gNum < 10 || gNum > 5000) {
          next.guestCount = "Guest count must be between 10 and 5,000.";
        } else {
          delete next.guestCount;
        }
        return next;
      });
    }
  };

  const handleGuestsBlur = () => {
    setTouched((prev) => ({ ...prev, guestCount: true }));
    validateField("guestCount");
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
        return prev;
      }
      return [...prev, p];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      weddingDate: true,
      city: true,
      totalBudget: true,
      guestCount: true,
      functions: true,
    });

    const isValid = validateField("");
    const numericBudget = parseNumericDigits(budgetString);
    const numericGuests = parseNumericDigits(guestsString);

    if (!isValid || numericBudget === null || numericGuests === null) return;

    onSubmit({
      couple_name: formatCoupleName(coupleName) || undefined,
      wedding_date: weddingDate,
      city: city.trim(),
      city_tier: cityTier,
      total_budget: numericBudget,
      guest_count: numericGuests,
      functions,
      style,
      priorities,
      special_requests: specialRequests.trim() || undefined,
    });
  };

  // Live per-guest calculation
  const numericBudget = parseNumericDigits(budgetString);
  const numericGuests = parseNumericDigits(guestsString);
  const livePerGuest =
    numericBudget !== null && numericGuests !== null && numericGuests > 0
      ? Math.round(numericBudget / numericGuests)
      : null;
  const inWords = numericBudget !== null && numericBudget > 0 ? formatNumberToIndianWords(numericBudget) : null;

  return (
    <section aria-labelledby="form-heading" className="form-card">
      <div className="form-header">
        <h1 id="form-heading" className="form-title">
          Plan Your Dream Indian Wedding
        </h1>
        <p className="form-intro">
          Enter your celebration details below to generate a tailored budget allocation, vendor procurement checklist, and countdown timeline.
        </p>
      </div>

      {isTightTimelineNotice() && (
        <Notice type="warning" title="Very Tight Timeline Notice">
          Your wedding is within 14 days! WedPlan AI will automatically adapt your preparation timeline and mark vendor bookings as Urgent.
        </Notice>
      )}

      <div aria-live="polite" className="sr-only">
        {Object.keys(errors).length > 0 &&
          `Form has ${Object.keys(errors).length} validation errors.`}
      </div>

      <form id="intake-form" onSubmit={handleSubmit} noValidate>
        {/* SECTION 1: BASICS */}
        <fieldset className="form-section-fieldset">
          <legend className="section-legend">
            <span className="section-number">1</span>
            <span>Celebration Basics</span>
          </legend>

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
                Appears on your plan and printed layout (max 60 chars)
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

            {/* Wedding City */}
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
                  Primary host city for the celebration
                </span>
              )}
            </div>

            {/* City Tier */}
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

        {/* SECTION 2: BUDGET & GUEST SCALE */}
        <fieldset className="form-section-fieldset">
          <legend className="section-legend">
            <span className="section-number">2</span>
            <span>Budget & Guest Scale</span>
          </legend>

          <div className="form-grid">
            {/* Total Budget */}
            <div className="form-group">
              <div className="label-with-preview">
                <label htmlFor="totalBudget" className="form-label">
                  Total Budget (INR) <span className="required-indicator">*</span>
                </label>
                <span className="live-words-pill" aria-live="polite">
                  {numericBudget !== null && inWords
                    ? `${formatCurrencyINR(numericBudget)} (${inWords})`
                    : "—"}
                </span>
              </div>
              <input
                id="totalBudget"
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                required
                className="form-input"
                value={budgetString}
                onChange={handleBudgetChange}
                onBlur={handleBudgetBlur}
                placeholder="e.g. 25,00,000"
                aria-invalid={!!(touched.totalBudget && errors.totalBudget)}
                aria-describedby={
                  errors.totalBudget ? "totalBudget-error" : "totalBudget-help"
                }
                autoComplete="off"
              />
              {touched.totalBudget && errors.totalBudget ? (
                <span id="totalBudget-error" className="field-error" role="alert" aria-live="polite">
                  {errors.totalBudget}
                </span>
              ) : (
                <span id="totalBudget-help" className="field-help">
                  Range: ₹50,000 to ₹10,00,00,000 (10 Cr)
                </span>
              )}
            </div>

            {/* Guest Count */}
            <div className="form-group">
              <div className="label-with-preview">
                <label htmlFor="guestCount" className="form-label">
                  Guest Count <span className="required-indicator">*</span>
                </label>
                <span className="live-words-pill" aria-live="polite">
                  {livePerGuest !== null
                    ? `Est. ${formatCurrencyINR(livePerGuest)} / guest`
                    : "—"}
                </span>
              </div>
              <input
                id="guestCount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                className="form-input"
                value={guestsString}
                onChange={handleGuestsChange}
                onBlur={handleGuestsBlur}
                placeholder="e.g. 350"
                aria-invalid={!!(touched.guestCount && errors.guestCount)}
                aria-describedby={
                  errors.guestCount ? "guestCount-error" : "guestCount-help"
                }
                autoComplete="off"
              />
              {touched.guestCount && errors.guestCount ? (
                <span id="guestCount-error" className="field-error" role="alert" aria-live="polite">
                  {errors.guestCount}
                </span>
              ) : (
                <span id="guestCount-help" className="field-help">
                  Between 10 and 5,000 attendees
                </span>
              )}
            </div>
          </div>
        </fieldset>

        {/* SECTION 3: CELEBRATION STYLE & PRIORITIES */}
        <fieldset className="form-section-fieldset">
          <legend className="section-legend">
            <span className="section-number">3</span>
            <span>Celebration Style & Priorities</span>
          </legend>

          <div className="form-grid">
            {/* Style / Vibe */}
            <div className="form-group form-group-full">
              <label htmlFor="style" className="form-label">
                Wedding Style / Vibe <span className="required-indicator">*</span>
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
                Customizes budget weightings, decor aesthetics, and vendor checklists
              </span>
            </div>

            {/* Celebrated Functions */}
            <div className="form-group form-group-full">
              <span id="functions-label" className="form-label">
                Celebrated Functions (Select all that apply) <span className="required-indicator">*</span>
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
                      {isSelected ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                      <span>{fn}</span>
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
                Top Priorities <span className="field-help">(Choose up to 3 to boost budget allocation)</span>
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
                      {isSelected ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
              <span className="field-help">
                {priorities.length}/3 selected. These categories receive higher percentage shares.
              </span>
            </div>
          </div>
        </fieldset>

        {/* SECTION 4: SPECIAL REQUESTS & TRADITIONS */}
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

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Assembling Your Dream Wedding Plan...</span>
              </>
            ) : (
              <>
                <SparklesIcon size={18} />
                <span>Generate Wedding Plan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
