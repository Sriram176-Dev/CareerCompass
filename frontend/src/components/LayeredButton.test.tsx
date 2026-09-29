import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LayeredButton } from "./LayeredButton";

// Helper to render with router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("LayeredButton", () => {
  describe("Rendering and Variants", () => {
    it("should render primary variant with correct token-based styles (primary background, primary-foreground text)", () => {
      renderWithRouter(<LayeredButton variant="primary">Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
    });

    it("should render secondary variant with correct token-based styles (background, foreground text, muted hover)", () => {
      renderWithRouter(<LayeredButton variant="secondary">Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-background");
      expect(button).toHaveClass("text-foreground");
      expect(button).toHaveClass("hover:bg-muted");
    });

    it("should default to primary variant when no variant is specified", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
    });
  });

  describe("Border Styling", () => {
    it("should have a 0.6px border (primary variant's border color comes from border-primary/50, merged over the base border-border via tailwind-merge)", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("border-[0.6px]");
      expect(button).toHaveClass("border-primary/50");
    });

    it("should have pill-shaped border radius (9999px)", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("rounded-[9999px]");
    });
  });

  describe("Padding", () => {
    it("should have 11px vertical padding", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("py-[11px]");
    });

    it("should have 29px horizontal padding", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("px-[29px]");
    });
  });

  describe("Typography", () => {
    it("should use 14px font size", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("text-[14px]");
    });

    it("should use medium (500) font weight", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("font-medium");
    });
  });

  describe("Glow Effect", () => {
    it("should have pseudo-element classes for glow effect", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      // Check for pseudo-element classes
      expect(button).toHaveClass("before:content-['']");
      expect(button).toHaveClass("before:absolute");
      expect(button).toHaveClass("before:top-0");
      expect(button).toHaveClass("before:left-0");
      expect(button).toHaveClass("before:right-0");
      expect(button).toHaveClass("before:h-[1px]");
      expect(button).toHaveClass("before:bg-foreground/20");
      expect(button).toHaveClass("before:blur-[2px]");
      expect(button).toHaveClass("before:opacity-60");
    });

    it("should have hover scale transform", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("hover:scale-[1.02]");
    });

    it("should increase glow opacity on hover", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("hover:before:opacity-100");
      expect(button).toHaveClass("before:transition-opacity");
      expect(button).toHaveClass("before:duration-200");
    });
  });

  describe("Link vs Button Element", () => {
    it("should render as Link element when href prop is provided", () => {
      renderWithRouter(<LayeredButton href="/test">Click me</LayeredButton>);
      const link = screen.getByRole("link", { name: /click me/i });

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("should render as button element when href prop is not provided", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("should call onClick handler when button is clicked", () => {
      const handleClick = vi.fn();
      renderWithRouter(<LayeredButton onClick={handleClick}>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      button.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom className", () => {
    it("should merge custom className with base styles", () => {
      renderWithRouter(<LayeredButton className="custom-class">Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-primary"); // base style should still be present
    });
  });

  describe("Positioning and Layout", () => {
    it("should have relative positioning for pseudo-element", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("relative");
    });

    it("should have inline-flex display with centered items", () => {
      renderWithRouter(<LayeredButton>Click me</LayeredButton>);
      const button = screen.getByRole("button", { name: /click me/i });

      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
    });
  });
});
