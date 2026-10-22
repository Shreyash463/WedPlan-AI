import { describe, it, expect } from "vitest";

/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio calculation utilities.
 */
function parseHex(hex: string): [number, number, number] {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Token pairs from variables.css for Light Theme
const LIGHT_THEME_TEXT_PAIRS = [
  { name: "Main text on white surface", fg: "#231F1C", bg: "#FFFFFF" },
  { name: "Main text on ivory app bg", fg: "#231F1C", bg: "#FCF9F5" },
  { name: "Muted text on white surface", fg: "#524C46", bg: "#FFFFFF" },
  { name: "Muted text on subtle surface", fg: "#524C46", bg: "#F7F3EE" },
  { name: "Primary brand on white surface", fg: "#800020", bg: "#FFFFFF" },
  { name: "White text on primary button", fg: "#FFFFFF", bg: "#800020" },
  { name: "Warning alert text on warning bg", fg: "#5A3600", bg: "#FFF3DC" },
  { name: "Critical alert text on critical bg", fg: "#7F1D1D", bg: "#FEE2E2" },
  { name: "Tip alert text on tip bg", fg: "#451A03", bg: "#FEF9EB" },
  { name: "Info alert text on info bg", fg: "#1E3A8A", bg: "#EFF6FF" },
  { name: "Healthy badge text on healthy bg", fg: "#166534", bg: "#DCFCE7" },
  { name: "Tight badge text on tight bg", fg: "#5A3600", bg: "#FFF3DC" },
  { name: "Unrealistic badge text on unrealistic bg", fg: "#7F1D1D", bg: "#FEE2E2" },
];

const LIGHT_THEME_UI_PAIRS = [
  { name: "Warning border on warning bg", fg: "#B45309", bg: "#FFF3DC" },
  { name: "Critical border on critical bg", fg: "#DC2626", bg: "#FEE2E2" },
  { name: "Tip border on tip bg", fg: "#9A7209", bg: "#FEF9EB" },
  { name: "Info border on info bg", fg: "#3B82F6", bg: "#EFF6FF" },
  { name: "Surface border on white surface", fg: "#8A7E72", bg: "#FFFFFF" },
];

// Token pairs from variables.css for Dark Theme
const DARK_THEME_TEXT_PAIRS = [
  { name: "Main text on dark surface", fg: "#F8F3EE", bg: "#221E1C" },
  { name: "Main text on dark app bg", fg: "#F8F3EE", bg: "#161413" },
  { name: "Muted text on dark surface", fg: "#B2A8A0", bg: "#221E1C" },
  { name: "Muted text on dark subtle surface", fg: "#B2A8A0", bg: "#2C2724" },
  { name: "Primary brand on dark surface", fg: "#F07185", bg: "#221E1C" },
  { name: "Dark inverse text on primary button", fg: "#161413", bg: "#F07185" },
  { name: "Warning alert text on warning bg", fg: "#FFE2B0", bg: "#3B2A10" },
  { name: "Critical alert text on critical bg", fg: "#FECACA", bg: "#451212" },
  { name: "Tip alert text on tip bg", fg: "#FDE68A", bg: "#2A2415" },
  { name: "Info alert text on info bg", fg: "#BFDBFE", bg: "#172554" },
  { name: "Healthy badge text on healthy bg", fg: "#86EFAC", bg: "#143320" },
  { name: "Tight badge text on tight bg", fg: "#FFE2B0", bg: "#3B2A10" },
  { name: "Unrealistic badge text on unrealistic bg", fg: "#FECACA", bg: "#451212" },
];

const DARK_THEME_UI_PAIRS = [
  { name: "Warning border on warning bg", fg: "#FBBF24", bg: "#3B2A10" },
  { name: "Critical border on critical bg", fg: "#F87171", bg: "#451212" },
  { name: "Tip border on tip bg", fg: "#E5C158", bg: "#2A2415" },
  { name: "Info border on info bg", fg: "#60A5FA", bg: "#172554" },
  { name: "Surface border on dark surface", fg: "#8A817A", bg: "#221E1C" },
];

describe("Automated WCAG 2.1 AA Contrast Audit", () => {
  describe("Light Theme Token Pairs", () => {
    LIGHT_THEME_TEXT_PAIRS.forEach(({ name, fg, bg }) => {
      it(`enforces >= 4.5:1 text contrast for: ${name}`, () => {
        const ratio = getContrastRatio(fg, bg);
        expect(
          ratio,
          `Expected contrast for ${name} (${fg} on ${bg}) to be >= 4.5:1, got ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      });
    });

    LIGHT_THEME_UI_PAIRS.forEach(({ name, fg, bg }) => {
      it(`enforces >= 3.0:1 UI component contrast for: ${name}`, () => {
        const ratio = getContrastRatio(fg, bg);
        expect(
          ratio,
          `Expected UI contrast for ${name} (${fg} on ${bg}) to be >= 3.0:1, got ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(3.0);
      });
    });
  });

  describe("Dark Theme Token Pairs", () => {
    DARK_THEME_TEXT_PAIRS.forEach(({ name, fg, bg }) => {
      it(`enforces >= 4.5:1 text contrast for: ${name}`, () => {
        const ratio = getContrastRatio(fg, bg);
        expect(
          ratio,
          `Expected contrast for ${name} (${fg} on ${bg}) to be >= 4.5:1, got ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      });
    });

    DARK_THEME_UI_PAIRS.forEach(({ name, fg, bg }) => {
      it(`enforces >= 3.0:1 UI component contrast for: ${name}`, () => {
        const ratio = getContrastRatio(fg, bg);
        expect(
          ratio,
          `Expected UI contrast for ${name} (${fg} on ${bg}) to be >= 3.0:1, got ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(3.0);
      });
    });
  });
});
