/**
 * Shared formatting utilities for Indian currency (INR), dates, and strings.
 */

/**
 * Formats a numeric value into standard Indian Rupee notation (e.g. ₹25,00,000).
 * Uses the Indian 3-2-2 grouping pattern (lakhs and crores).
 */
export function formatCurrencyINR(amount: number): string {
  if (isNaN(amount)) return "₹0";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const s = Math.round(amount).toString();
    return `₹${formatIndianGrouping(s)}`;
  }
}

/**
 * Formats a number with Indian grouping without currency symbol (e.g. 25,00,000).
 */
export function formatCurrencyPlainINR(amount: number): string {
  if (isNaN(amount)) return "0";
  try {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return formatIndianGrouping(Math.round(amount).toString());
  }
}

/**
 * Helper to produce 3-2-2 grouping for string numbers.
 */
export function formatIndianGrouping(numStr: string): string {
  const isNeg = numStr.startsWith("-");
  const s = isNeg ? numStr.slice(1) : numStr;
  if (s.length <= 3) return (isNeg ? "-" : "") + s;
  const lastThree = s.slice(-3);
  let rem = s.slice(0, -3);
  const groups: string[] = [];
  while (rem.length > 2) {
    groups.unshift(rem.slice(-2));
    rem = rem.slice(0, -2);
  }
  if (rem.length > 0) {
    groups.unshift(rem);
  }
  return (isNeg ? "-" : "") + groups.join(",") + "," + lastThree;
}

/**
 * Keeps digits only from user input. Strips commas, spaces, currency symbols (₹, Rs, INR), and letters.
 * Strips leading zeros unless the string is exactly "0".
 * Caps length at maxDigits (default 10).
 */
export function sanitizeDigitsOnly(val: string, maxDigits = 10): string {
  if (!val) return "";
  // Keep only 0-9
  let digits = val.replace(/\D/g, "");
  // Strip leading zeros if followed by other digits (e.g. "08515" -> "8515")
  digits = digits.replace(/^0+(?=\d)/, "");
  if (digits.length > maxDigits) {
    digits = digits.slice(0, maxDigits);
  }
  return digits;
}

/**
 * Formats a raw digit string into Indian grouping (e.g. "2500000" -> "25,00,000").
 */
export function formatDigitsIndianGrouping(digits: string): string {
  if (!digits) return "";
  const cleaned = digits.replace(/\D/g, "");
  if (!cleaned) return "";
  return formatIndianGrouping(cleaned);
}

/**
 * Parses numeric value from a formatted or raw string, or returns null if empty/invalid.
 */
export function parseNumericDigits(val: string): number | null {
  const digits = val.replace(/\D/g, "");
  if (!digits) return null;
  const num = parseInt(digits, 10);
  return isNaN(num) ? null : num;
}

/**
 * Formats currency in compact Indian notation (e.g. ₹50 K, ₹25 L, ₹1.5 Cr, ₹10 Cr).
 */
export function formatCurrencyCompactINR(amount: number): string {
  if (isNaN(amount)) return "₹0";
  const amt = Math.abs(Math.round(amount));
  const prefix = amount < 0 ? "-₹" : "₹";

  if (amt >= 10_000_000) {
    const val = (amt / 10_000_000).toFixed(2).replace(/\.?0+$/, "");
    return `${prefix}${val} Cr`;
  }
  if (amt >= 100_000) {
    const val = (amt / 100_000).toFixed(2).replace(/\.?0+$/, "");
    return `${prefix}${val} L`;
  }
  if (amt >= 1_000) {
    const val = (amt / 1_000).toFixed(1).replace(/\.?0+$/, "");
    return `${prefix}${val} K`;
  }
  return `${prefix}${amt}`;
}

/**
 * Formats an amount into natural spoken words for Indian weddings (e.g. "25 Lakh", "1.5 Crore").
 */
export function formatNumberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount <= 0) return "";
  const amt = Math.round(amount);
  if (amt >= 10_000_000) {
    const val = (amt / 10_000_000).toFixed(2).replace(/\.?0+$/, "");
    return `${val} Crore`;
  }
  if (amt >= 100_000) {
    const val = (amt / 100_000).toFixed(2).replace(/\.?0+$/, "");
    return `${val} Lakh`;
  }
  if (amt >= 1_000) {
    const val = (amt / 1_000).toFixed(1).replace(/\.?0+$/, "");
    return `${val} Thousand`;
  }
  return `${amt}`;
}

const LOWERCASE_NAME_CONNECTORS = new Set(["and", "weds", "with"]);
const KNOWN_ACRONYMS = new Set(["dj", "mc", "nri", "usa", "uk", "uae"]);

function formatNameToken(token: string): string {
  if (!token) return "";
  if (token === "&") return "&";

  // Handle punctuation wrappers like (NRI), [DJ], "Priya"
  const wrapMatch = token.match(/^([([{"']*)(.*?)([)\]}"']*)$/);
  if (wrapMatch && (wrapMatch[1] || wrapMatch[3])) {
    const [, pre, core, post] = wrapMatch;
    if (core) {
      return pre + formatNameToken(core) + post;
    }
  }

  if (token.includes("-")) {
    return token.split("-").map(formatNameToken).join("-");
  }

  if (token.includes("'")) {
    const parts = token.split("'");
    if (parts.length === 2 && parts[1].toLowerCase() === "s") {
      return `${formatNameToken(parts[0])}'s`;
    }
    return parts.map(formatNameToken).join("'");
  }

  const lower = token.toLowerCase();
  if (
    KNOWN_ACRONYMS.has(lower) ||
    (token === token.toUpperCase() && token.length >= 2 && token.length <= 4 && /^[A-Za-z]+$/.test(token))
  ) {
    return token.toUpperCase();
  }

  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/**
 * Normalizes couple/event names to Title Case.
 * e.g. "namrata and chetan" -> "Namrata and Chetan"
 * e.g. "priya & rohan" -> "Priya & Rohan"
 */
export function formatCoupleName(name?: string | null): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const words = cleaned.split(" ");
  const total = words.length;

  return words
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (LOWERCASE_NAME_CONNECTORS.has(lower) && idx > 0 && idx < total - 1) {
        return lower;
      }
      if (word === "&") {
        return "&";
      }
      return formatNameToken(word);
    })
    .join(" ");
}

/**
 * Title-cases an Indian city name (e.g. 'new delhi' -> 'New Delhi', 'jaipur' -> 'Jaipur', 'hubli-dharwad' -> 'Hubli-Dharwad').
 */
export function capitalizeCity(city: string): string {
  if (!city) return "";
  return city
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("-")
    )
    .join(" ");
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into readable Indian date notation (e.g. 24 Dec 2026).
 */
export function formatDateReadable(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return isoDate;
  } catch {
    return isoDate;
  }
}

/**
 * Formats a fraction or percentage into clean string (e.g. 18.5%).
 */
export function formatPercentage(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
