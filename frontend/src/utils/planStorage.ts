/**
 * Plan-scoped localStorage persistence for milestone tasks and vendor status.
 *
 * Each plan has a deterministic fingerprint derived from its normalized input parameters.
 * Maintains an MRU index of the 5 most recent plans to prevent unbounded localStorage growth.
 */
import { PlanFormInput, VendorStatus } from "../types";

const RECENT_PLANS_KEY = "wedplan:v2:recent_plans";
const MAX_RECENT_PLANS = 5;

/**
 * Computes a deterministic 16-hex character hash from normalized plan input parameters.
 */
export function computePlanFingerprint(input: PlanFormInput): string {
  if (!input) return "default";

  const norm = [
    (input.couple_name || "").trim().toLowerCase(),
    (input.wedding_date || "").trim(),
    (input.city || "").trim().toLowerCase(),
    (input.city_tier || "").trim(),
    String(input.total_budget || 0),
    String(input.guest_count || 0),
    (input.style || "").trim(),
    [...(input.functions || [])].sort().join(","),
    [...(input.priorities || [])].sort().join(","),
    (input.special_requests || "").trim().toLowerCase(),
  ].join("|");

  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x5a5a5a5a;
  for (let i = 0; i < norm.length; i++) {
    const c = norm.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c << 1;
    h2 = Math.imul(h2, 0x01000193);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${part1}${part2}`;
}

/**
 * Updates the MRU list of recent plans and prunes older plans exceeding MAX_RECENT_PLANS.
 */
export function registerPlanAccess(hash: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;

    let recent: string[] = [];
    const raw = window.localStorage.getItem(RECENT_PLANS_KEY);
    if (raw) {
      recent = JSON.parse(raw);
    }
    if (!Array.isArray(recent)) recent = [];

    // Filter out current hash and place at front
    recent = [hash, ...recent.filter((h) => h !== hash)];

    // Prune entries beyond limit
    while (recent.length > MAX_RECENT_PLANS) {
      const evicted = recent.pop();
      if (evicted) {
        window.localStorage.removeItem(`wedplan:v2:${evicted}:tasks`);
        window.localStorage.removeItem(`wedplan:v2:${evicted}:vendors`);
      }
    }

    window.localStorage.setItem(RECENT_PLANS_KEY, JSON.stringify(recent));
  } catch {
    // Ignore localStorage errors (private mode / quota)
  }
}

/**
 * Loads completed task IDs for a specific plan fingerprint.
 */
export function getStoredTasks(hash: string): string[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    registerPlanAccess(hash);
    const key = `wedplan:v2:${hash}:tasks`;
    const val = window.localStorage.getItem(key);
    if (!val) return [];
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves completed task IDs for a specific plan fingerprint.
 */
export function saveStoredTasks(hash: string, tasks: string[]): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    registerPlanAccess(hash);
    const key = `wedplan:v2:${hash}:tasks`;
    window.localStorage.setItem(key, JSON.stringify(tasks));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Loads vendor status dictionary for a specific plan fingerprint.
 */
export function getStoredVendorStatuses(hash: string): Record<string, VendorStatus> {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    registerPlanAccess(hash);
    const key = `wedplan:v2:${hash}:vendors`;
    const val = window.localStorage.getItem(key);
    if (!val) return {};
    const parsed = JSON.parse(val);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Saves vendor status dictionary for a specific plan fingerprint.
 */
export function saveStoredVendorStatuses(hash: string, statuses: Record<string, VendorStatus>): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    registerPlanAccess(hash);
    const key = `wedplan:v2:${hash}:vendors`;
    window.localStorage.setItem(key, JSON.stringify(statuses));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Clean up legacy global keys so they don't leak into v2 per-plan storage.
 */
export function cleanupLegacyKeys(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem("wedplan_completed_tasks");
    window.localStorage.removeItem("wedplan_vendor_statuses");
  } catch {
    // Ignore
  }
}
