/**
 * Date and percentage formatting utilities.
 */

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

/**
 * Returns a default wedding date 6 months from today in YYYY-MM-DD.
 */
export function getDefaultWeddingDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().split("T")[0];
}

/**
 * Checks if a date is strictly within a given number of future days from today.
 */
export function isWithinDays(isoDate: string, days = 14): boolean {
  if (!isoDate) return false;
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 && diff <= days;
}
