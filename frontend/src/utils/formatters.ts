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
function formatIndianGrouping(numStr: string): string {
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

/**
 * Title-cases an Indian city name (e.g. 'new delhi' -> 'New Delhi', 'jaipur' -> 'Jaipur').
 */
export function capitalizeCity(city: string): string {
  if (!city) return "";
  return city
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
