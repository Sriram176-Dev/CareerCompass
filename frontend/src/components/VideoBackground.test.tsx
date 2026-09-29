import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoBackground } from "./VideoBackground";

describe("VideoBackground", () => {
  const CLOUDFRONT_VIDEO_URL =
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4";

  it("should render video element with correct attributes (autoplay, muted, loop, playsInline)", () => {
    const { container } = render(<VideoBackground videoUrl="test.mp4" />);
    const video = container.querySelector("video");

    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "test.mp4");
    // Check boolean properties directly on the element
    expect(video?.autoplay).toBe(true);
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.playsInline).toBe(true);
  });

  it("should render video src matching CloudFront URL", () => {
    const { container } = render(
      <VideoBackground videoUrl={CLOUDFRONT_VIDEO_URL} />
    );
    const video = container.querySelector("video");

    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", CLOUDFRONT_VIDEO_URL);
  });

  it("should render video with object-fit cover and absolute positioning", () => {
    const { container } = render(<VideoBackground videoUrl="test.mp4" />);
    const video = container.querySelector("video");

    expect(video).toHaveClass("object-cover");
    expect(video).toHaveClass("absolute");
    // z-0 lives on the outer wrapper div (the stacking context), not the
    // video itself — the video has no explicit z-index of its own.
    expect(video).not.toHaveClass("z-0");
  });

  it("should render overlay with 50% opacity (default)", () => {
    const { container } = render(<VideoBackground videoUrl="test.mp4" />);
    const overlays = container.querySelectorAll("div");
    const overlay = Array.from(overlays).find((div) =>
      div.className.includes("z-10")
    );

    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0.5)" });
  });

  it("should render overlay with custom opacity", () => {
    const { container } = render(
      <VideoBackground videoUrl="test.mp4" overlayOpacity={0.7} />
    );
    const overlays = container.querySelectorAll("div");
    const overlay = Array.from(overlays).find((div) =>
      div.className.includes("z-10")
    );

    expect(overlay).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0.7)" });
  });

  it("should display fallback background on video error", () => {
    const { container } = render(<VideoBackground videoUrl="invalid.mp4" />);
    const video = container.querySelector("video");

    fireEvent.error(video!);

    const fallbackDiv = container.querySelector(".z-0");
    expect(fallbackDiv).toBeInTheDocument();
    expect(fallbackDiv).toHaveStyle({ backgroundColor: "rgb(0, 0, 0)" }); // "#000" default normalizes to rgb() in the rendered inline style
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("should display fallback background with black color on video error", () => {
    const { container } = render(<VideoBackground videoUrl="invalid.mp4" />);
    const video = container.querySelector("video");

    fireEvent.error(video!);

    const fallbackDiv = container.querySelector(".z-0");
    expect(fallbackDiv).toBeInTheDocument();
    expect(fallbackDiv).toHaveStyle({ backgroundColor: "rgb(0, 0, 0)" }); // "#000" default normalizes to rgb() in the rendered inline style
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("should display custom fallback color on video error", () => {
    const { container } = render(
      <VideoBackground videoUrl="invalid.mp4" fallbackColor="#333333" />
    );
    const video = container.querySelector("video");

    fireEvent.error(video!);

    const fallbackDiv = container.querySelector(".z-0");
    expect(fallbackDiv).toHaveStyle({ backgroundColor: "#333333" });
  });

  it("should position the wrapper at z-0 and overlay at z-10 (video itself has no explicit z-index)", () => {
    const { container } = render(<VideoBackground videoUrl="test.mp4" />);
    const video = container.querySelector("video");
    const wrapper = container.firstElementChild;
    const overlays = container.querySelectorAll("div");
    const overlay = Array.from(overlays).find((div) =>
      div.className.includes("z-10")
    );

    expect(wrapper).toHaveClass("z-0");
    expect(video).not.toHaveClass("z-0");
    expect(overlay).toHaveClass("z-10");
  });

  it("should not render the video element at all when prefers-reduced-motion is enabled (avoids downloading it unnecessarily)", () => {
    // Mock matchMedia to return prefers-reduced-motion: reduce
    const mockMatchMedia = (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    });

    const { container } = render(<VideoBackground videoUrl="test.mp4" />);
    const video = container.querySelector("video");

    // The component omits the <video> tag entirely rather than rendering
    // it paused — better for bandwidth and more correct than shipping the
    // video and merely suppressing autoplay.
    expect(video).not.toBeInTheDocument();
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it("should enable autoplay when prefers-reduced-motion is not set", () => {
    // Mock matchMedia to return prefers-reduced-motion: no-preference
    const mockMatchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    });

    const { container } = render(<VideoBackground videoUrl="test.mp4" />);
    const video = container.querySelector("video");

    expect(video).toBeInTheDocument();
    expect(video?.autoplay).toBe(true);
  });

  it("should have preload='auto' attribute for optimized loading", () => {
    const { container } = render(<VideoBackground videoUrl="test.mp4" />);
    const video = container.querySelector("video");

    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("preload", "auto");
  });
});

// Property-Based Tests
import * as fc from "fast-check";

describe("VideoBackground - Property-Based Tests", () => {
  /**
   * Feature: modern-hero-landing-redesign
   * Property 7: Video Fullscreen Coverage
   * 
   * **Validates: Requirements 2.1**
   * 
   * For any viewport dimensions, the Background_Video element should have
   * width and height that match or exceed the viewport dimensions to ensure
   * fullscreen coverage.
   */
  it("should ensure video covers entire viewport for any dimensions", () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 320, max: 3840 }),
          height: fc.integer({ min: 568, max: 2160 }),
        }),
        ({ width, height }) => {
          // Set viewport dimensions
          Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: width,
          });
          Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: height,
          });

          // Render component
          const { container } = render(
            <VideoBackground videoUrl="test.mp4" />
          );
          const video = container.querySelector("video");

          // Verify video element exists
          expect(video).toBeInTheDocument();

          // Check that video has classes that ensure fullscreen coverage
          // The video should have:
          // - absolute positioning (absolute)
          // - full width and height (w-full h-full)
          // - object-fit cover (object-cover) to fill the container
          expect(video).toHaveClass("absolute");
          expect(video).toHaveClass("w-full");
          expect(video).toHaveClass("h-full");
          expect(video).toHaveClass("object-cover");
          expect(video).toHaveClass("inset-0");

          // The combination of these classes ensures:
          // - absolute positioning with inset-0 makes it fill the parent container
          // - w-full and h-full make it 100% width and height
          // - object-cover ensures the video scales to cover the entire area
          //   while maintaining aspect ratio (may crop if needed)
        }
      ),
      { numRuns: 100 }
    );
  });
});
