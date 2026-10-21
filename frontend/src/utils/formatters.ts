/**
 * Formats a numeric value into standard Indian Rupee notation (e.g. ₹25,00,000).
 */
export function formatCurrencyINR(amount: number): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
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
