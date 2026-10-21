import { describe, it, expect } from "vitest";
import {
  formatCurrencyINR,
  formatCurrencyCompactINR,
  formatCurrencyPlainINR,
  formatNumberToIndianWords,
  capitalizeCity,
  formatDateReadable,
  formatPercentage,
} from "../src/utils/formatters";

describe("Frontend Formatters Utility", () => {
  it("formats Indian Currency in 3-2-2 grouping", () => {
    expect(formatCurrencyINR(2500000)).toMatch(/25,00,000/);
    expect(formatCurrencyINR(50000)).toMatch(/50,000/);
    expect(formatCurrencyINR(100000000)).toMatch(/10,00,00,000/);
  });

  it("formats plain Indian numbers without symbol", () => {
    expect(formatCurrencyPlainINR(2500000)).toBe("25,00,000");
    expect(formatCurrencyPlainINR(50000)).toBe("50,000");
  });

  it("formats compact Indian notations for sliders and tags", () => {
    expect(formatCurrencyCompactINR(50000)).toBe("₹50 K");
    expect(formatCurrencyCompactINR(2500000)).toBe("₹25 L");
    expect(formatCurrencyCompactINR(15000000)).toBe("₹1.5 Cr");
    expect(formatCurrencyCompactINR(100000000)).toBe("₹10 Cr");
  });

  it("formats spoken Indian numbers into natural words", () => {
    expect(formatNumberToIndianWords(2500000)).toBe("25 Lakh");
    expect(formatNumberToIndianWords(15000000)).toBe("1.5 Crore");
    expect(formatNumberToIndianWords(80000)).toBe("80 Thousand");
  });

  it("capitalizes Indian city names cleanly", () => {
    expect(capitalizeCity("new delhi")).toBe("New Delhi");
    expect(capitalizeCity("jaipur")).toBe("Jaipur");
    expect(capitalizeCity("mumbai")).toBe("Mumbai");
    expect(capitalizeCity("")).toBe("");
  });

  it("formats readable dates and percentages", () => {
    expect(formatDateReadable("2026-11-20")).toMatch(/20/);
    expect(formatDateReadable("2026-11-20")).toMatch(/Nov/i);
    expect(formatPercentage(18.543)).toBe("18.5%");
  });
});
