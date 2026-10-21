import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../src/App";

describe("Accessibility Standards (WCAG 2.1 AA)", () => {
  it("contains semantic HTML landmarks (banner, main, contentinfo)", () => {
    render(<App />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("provides a visible 'Skip to main content' link targeting #main-content", () => {
    render(<App />);

    const skipLink = screen.getByRole("link", { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("has exactly one h1 element on initial load", () => {
    const { container } = render(<App />);
    const h1Elements = container.querySelectorAll("h1");
    expect(h1Elements.length).toBe(1);
  });

  it("ensures all input controls in IntakeForm have associated accessible labels", () => {
    render(<App />);

    const inputs = screen.getAllByRole("textbox");
    for (const input of inputs) {
      expect(input).toHaveAccessibleName();
    }

    const comboboxes = screen.getAllByRole("combobox");
    for (const select of comboboxes) {
      expect(select).toHaveAccessibleName();
    }
  });

  it("has live region for screen reader dynamic feedback", () => {
    const { container } = render(<App />);
    const liveRegions = container.querySelectorAll("[aria-live]");
    expect(liveRegions.length).toBeGreaterThan(0);
  });
});
