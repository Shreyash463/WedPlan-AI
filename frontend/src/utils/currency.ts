/**
 * Indian Rupee (INR) currency formatting and grouping utilities.
 */

/**
 * Produces standard 3-2-2 grouping for string numbers (e.g. "2500000" -> "25,00,000").
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
 * Formats a numeric value into standard Indian Rupee notation (e.g. ₹25,00,000).
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
 * Keeps digits only from user input, stripping commas, spaces, and currency symbols.
 * Strips leading zeros unless the string is exactly "0".
 */
export function sanitizeDigitsOnly(val: string, maxDigits = 10): string {
  if (!val) return "";
  let digits = val.replace(/\D/g, "");
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
 * Formats currency in compact Indian notation (e.g. ₹50 K, ₹25 L, ₹1.5 Cr).
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
 * Formats an amount into natural spoken words for Indian weddings (e.g. "25 Lakh").
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
