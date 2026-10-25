import React, { useState } from "react";
import { CityTier, Priority, WeddingFunction, WeddingStyle } from "../../types";
import {
  formatCoupleName,
  formatDigitsIndianGrouping,
  formatNumberToIndianWords,
  parseNumericDigits,
  sanitizeDigitsOnly,
} from "../../utils/formatters";
import { getDefaultWeddingDate, isWithinDays } from "../../utils/dates";
import { Notice } from "../../components/common/Notice";
import { SparklesIcon } from "../../components/common/Icons";
import { IntakeFormProps } from "./types";
import { BasicsSection } from "./BasicsSection";
import { BudgetGuestsSection } from "./BudgetGuestsSection";
import { StylePrioritiesSection } from "./StylePrioritiesSection";
import { SpecialRequestsSection } from "./SpecialRequestsSection";
import { validateIntakeForm } from "./validation";

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, isLoading, initialValues }) => {
  const [coupleName, setCoupleName] = useState(initialValues?.couple_name || "");
  const [weddingDate, setWeddingDate] = useState(initialValues?.wedding_date || getDefaultWeddingDate());
  const [city, setCity] = useState(initialValues?.city || "Jaipur");
  const [cityTier, setCityTier] = useState<CityTier>(initialValues?.city_tier || "Tier-2");
  const [budgetString, setBudgetString] = useState(
    initialValues?.total_budget ? formatDigitsIndianGrouping(String(initialValues.total_budget)) : "25,00,000"
  );
  const [guestsString, setGuestsString] = useState(
    initialValues?.guest_count ? String(initialValues.guest_count) : "350"
  );
  const [functions, setFunctions] = useState<WeddingFunction[]>(
    initialValues?.functions || ["Haldi", "Mehendi", "Sangeet", "Wedding"]
  );
  const [style, setStyle] = useState<WeddingStyle>(initialValues?.style || "Royal/Palace");
  const [priorities, setPriorities] = useState<Priority[]>(initialValues?.priorities || ["Food", "Venue & Decor"]);
  const [specialRequests, setSpecialRequests] = useState(initialValues?.special_requests || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const runValidation = (field?: string): boolean => {
    const updated = validateIntakeForm({ weddingDate, city, budgetString, guestsString, functions }, errors, field);
    setErrors(updated);
    return Object.keys(updated).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ weddingDate: true, city: true, totalBudget: true, guestCount: true, functions: true });
    const isValid = runValidation();
    const numB = parseNumericDigits(budgetString);
    const numG = parseNumericDigits(guestsString);
    if (!isValid || numB === null || numG === null) return;
    onSubmit({
      couple_name: formatCoupleName(coupleName) || undefined,
      wedding_date: weddingDate,
      city: city.trim(),
      city_tier: cityTier,
      total_budget: numB,
      guest_count: numG,
      functions,
      style,
      priorities,
      special_requests: specialRequests.trim() || undefined,
    });
  };

  const numB = parseNumericDigits(budgetString);
  const numG = parseNumericDigits(guestsString);
  const livePerGuest = numB !== null && numG !== null && numG > 0 ? Math.round(numB / numG) : null;
  const inWords = numB !== null && numB > 0 ? formatNumberToIndianWords(numB) : null;

  return (
    <section aria-labelledby="form-heading" className="form-card">
      <div className="form-header">
        <h1 id="form-heading" className="form-title">
          Plan Your Dream Indian Wedding
        </h1>
        <p className="form-intro">
          Enter your celebration details below to generate a tailored budget allocation, vendor procurement checklist,
          and countdown timeline.
        </p>
      </div>

      {isWithinDays(weddingDate, 14) && (
        <Notice type="warning" title="Very Tight Timeline Notice">
          Your wedding is within 14 days! WedPlan AI will automatically adapt your preparation timeline and mark vendor
          bookings as Urgent.
        </Notice>
      )}

      <form id="intake-form" onSubmit={handleSubmit} noValidate>
        <BasicsSection
          coupleName={coupleName}
          setCoupleName={setCoupleName}
          weddingDate={weddingDate}
          setWeddingDate={setWeddingDate}
          city={city}
          setCity={setCity}
          cityTier={cityTier}
          setCityTier={setCityTier}
          touched={touched}
          errors={errors}
          onBlur={(f) => {
            setTouched((prev) => ({ ...prev, [f]: true }));
            runValidation(f);
          }}
          validateField={(f) => runValidation(f)}
        />
        <BudgetGuestsSection
          budgetString={budgetString}
          onBudgetChange={(e) => {
            setBudgetString(sanitizeDigitsOnly(e.target.value, 10));
            if (touched.totalBudget) runValidation("totalBudget");
          }}
          onBudgetBlur={() => {
            setTouched((prev) => ({ ...prev, totalBudget: true }));
            if (budgetString.trim()) setBudgetString(formatDigitsIndianGrouping(budgetString));
            runValidation("totalBudget");
          }}
          guestsString={guestsString}
          onGuestsChange={(e) => {
            setGuestsString(sanitizeDigitsOnly(e.target.value, 5));
            if (touched.guestCount) runValidation("guestCount");
          }}
          onGuestsBlur={() => {
            setTouched((prev) => ({ ...prev, guestCount: true }));
            runValidation("guestCount");
          }}
          numericBudget={numB}
          numericGuests={numG}
          livePerGuest={livePerGuest}
          inWords={inWords}
          touched={touched}
          errors={errors}
        />
        <StylePrioritiesSection
          style={style}
          setStyle={setStyle}
          functions={functions}
          toggleFunction={(fn) =>
            setFunctions((prev) => (prev.includes(fn) ? prev.filter((i) => i !== fn) : [...prev, fn]))
          }
          priorities={priorities}
          togglePriority={(p) =>
            setPriorities((prev) =>
              prev.includes(p) ? prev.filter((i) => i !== p) : prev.length < 3 ? [...prev, p] : prev
            )
          }
          errors={errors}
        />
        <SpecialRequestsSection specialRequests={specialRequests} setSpecialRequests={setSpecialRequests} />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-submit" disabled={isLoading}>
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
