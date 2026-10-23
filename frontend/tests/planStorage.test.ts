import { describe, it, expect, beforeEach } from "vitest";
import {
  computePlanFingerprint,
  getStoredTasks,
  saveStoredTasks,
  getStoredVendorStatuses,
  saveStoredVendorStatuses,
  cleanupLegacyKeys,
} from "../src/utils/planStorage";
import { PlanFormInput } from "../src/types";

describe("planStorage per-plan persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const baseInput1: PlanFormInput = {
    couple_name: "Priya & Rohan",
    wedding_date: "2026-11-20",
    city: "Jaipur",
    city_tier: "Tier-2",
    total_budget: 3000000,
    guest_count: 300,
    functions: ["Wedding", "Haldi"],
    style: "Royal/Palace",
    priorities: ["Food", "Decor"],
    special_requests: "Vegetarian only",
  };

  const baseInput2: PlanFormInput = {
    couple_name: "Ananya & Kabir",
    wedding_date: "2026-12-10",
    city: "Goa",
    city_tier: "Tier-2",
    total_budget: 4000000,
    guest_count: 150,
    functions: ["Wedding", "Cocktail"],
    style: "Modern/Contemporary",
    priorities: ["Entertainment"],
    special_requests: "Sunset beach",
  };

  it("computes deterministic fingerprints ignoring case and array ordering", () => {
    const hash1 = computePlanFingerprint(baseInput1);
    const hash1Reordered: PlanFormInput = {
      ...baseInput1,
      couple_name: "priya & rohan",
      city: "jaipur",
      functions: ["Haldi", "Wedding"],
      priorities: ["Decor", "Food"],
    };
    const hash1Variant = computePlanFingerprint(hash1Reordered);
    expect(hash1).toBe(hash1Variant);

    const hash2 = computePlanFingerprint(baseInput2);
    expect(hash1).not.toBe(hash2);
  });

  it("isolates completed tasks between different plans", () => {
    const hash1 = computePlanFingerprint(baseInput1);
    const hash2 = computePlanFingerprint(baseInput2);

    // Save tasks for plan 1
    saveStoredTasks(hash1, ["task_venue_booking", "task_photo_booking"]);
    expect(getStoredTasks(hash1)).toEqual(["task_venue_booking", "task_photo_booking"]);

    // Plan 2 should start fresh with 0 tasks
    expect(getStoredTasks(hash2)).toEqual([]);

    // Save tasks for plan 2
    saveStoredTasks(hash2, ["task_decor_mandap"]);
    expect(getStoredTasks(hash2)).toEqual(["task_decor_mandap"]);

    // Plan 1 remains unaffected
    expect(getStoredTasks(hash1)).toEqual(["task_venue_booking", "task_photo_booking"]);
  });

  it("isolates vendor statuses between different plans", () => {
    const hash1 = computePlanFingerprint(baseInput1);
    const hash2 = computePlanFingerprint(baseInput2);

    saveStoredVendorStatuses(hash1, { vendor_venue: "Booked", vendor_photo: "Contacted" });
    expect(getStoredVendorStatuses(hash1)).toEqual({
      vendor_venue: "Booked",
      vendor_photo: "Contacted",
    });

    expect(getStoredVendorStatuses(hash2)).toEqual({});
  });

  it("prunes plans beyond the 5 most recent to prevent storage leaks", () => {
    const hashes = ["h1", "h2", "h3", "h4", "h5", "h6"];
    hashes.forEach((h) => {
      saveStoredTasks(h, [`task_${h}`]);
    });

    // h1 was oldest and should be evicted
    expect(localStorage.getItem("wedplan:v2:h1:tasks")).toBeNull();
    // h2 through h6 should still exist
    expect(getStoredTasks("h6")).toEqual(["task_h6"]);
    expect(getStoredTasks("h2")).toEqual(["task_h2"]);
  });

  it("cleans up legacy global keys", () => {
    localStorage.setItem("wedplan_completed_tasks", JSON.stringify(["old_task"]));
    localStorage.setItem("wedplan_vendor_statuses", JSON.stringify({ old_vendor: "Booked" }));

    cleanupLegacyKeys();

    expect(localStorage.getItem("wedplan_completed_tasks")).toBeNull();
    expect(localStorage.getItem("wedplan_vendor_statuses")).toBeNull();
  });

  it("gracefully handles corrupted JSON in localStorage", () => {
    localStorage.setItem("wedplan:v2:corrupt:tasks", "{invalid-json");
    localStorage.setItem("wedplan:v2:corrupt:vendors", "{invalid-json");

    expect(getStoredTasks("corrupt")).toEqual([]);
    expect(getStoredVendorStatuses("corrupt")).toEqual({});
  });
});
