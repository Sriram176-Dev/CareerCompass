import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BadgePill } from "./BadgePill";

// Updated for the theme-aware redesign: BadgePill uses token-based colors
// (bg-muted, border-border, text-foreground/text-muted-foreground, bg-primary
// for the dot) with dark: white-opacity variants layered on top, instead of
// hardcoded white-only classes. These tests assert the real, current,
// theme-aware implementation.
describe("BadgePill", () => {
  describe("Border Radius", () => {
    it("should have 20px border radius", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const badge = screen.getByText("Early access available from").parentElement;
      expect(badge).toHaveClass("rounded-[20px]");
    });
  });

  describe("Background Styling", () => {
    it("should use a token-based background with a dark-mode white-opacity variant", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const badge = screen.getByText("Early access available from").parentElement;
      expect(badge).toHaveClass("bg-muted/50");
      expect(badge).toHaveClass("dark:bg-white/10");
    });
  });

  describe("Border Styling", () => {
    it("should have a token-based border with a dark-mode white-opacity variant", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const badge = screen.getByText("Early access available from").parentElement;
      expect(badge).toHaveClass("border");
      expect(badge).toHaveClass("border-border");
      expect(badge).toHaveClass("dark:border-white/20");
    });
  });

  describe("Dot Indicator", () => {
    it("should display a 4px primary-colored circle dot indicator", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const badge = screen.getByText("Early access available from").parentElement;
      const dot = badge?.querySelector("span.w-1");

      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("w-1"); // w-1 = 4px in Tailwind
      expect(dot).toHaveClass("h-1"); // h-1 = 4px in Tailwind
      expect(dot).toHaveClass("rounded-full");
      expect(dot).toHaveClass("bg-primary");
    });
  });

  describe("Text Emphasis", () => {
    it("should display the label with muted emphasis (token-based, dark-mode-aware)", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const label = screen.getByText("Early access available from");
      expect(label).toHaveClass("text-muted-foreground");
      expect(label).toHaveClass("dark:text-white/60");
    });

    it("should display the date with full emphasis (foreground, dark-mode-aware, semibold)", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const date = screen.getByText("May 1, 2026");
      expect(date).toHaveClass("text-foreground");
      expect(date).toHaveClass("dark:text-white");
      expect(date).toHaveClass("font-semibold");
    });
  });

  describe("Typography", () => {
    it("should use 13px font size", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const badge = screen.getByText("Early access available from").parentElement;
      expect(badge).toHaveClass("text-[13px]");
    });

    it("should use medium (500) font weight", () => {
      render(<BadgePill label="Early access available from" date="May 1, 2026" />);
      const badge = screen.getByText("Early access available from").parentElement;
      expect(badge).toHaveClass("font-medium");
    });
  });
});
