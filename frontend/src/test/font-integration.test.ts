import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Updated for the Career Compass redesign: Space Grotesk (headings) +
// IBM Plex Sans (body) replaced the previous Inter / General Sans pairing.
describe("Font Integration", () => {
  it("should import Space Grotesk and IBM Plex Sans from Google Fonts in index.css", () => {
    const cssPath = resolve(__dirname, "../index.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("fonts.googleapis.com");
    expect(cssContent).toContain("Space+Grotesk");
    expect(cssContent).toContain("IBM+Plex+Sans");
  });

  it("should apply IBM Plex Sans as the primary body font with fallback stack", () => {
    const cssPath = resolve(__dirname, "../index.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("font-family: 'IBM Plex Sans'");
    expect(cssContent).toContain("-apple-system");
    expect(cssContent).toContain("BlinkMacSystemFont");
    expect(cssContent).toContain("'Segoe UI'");
    expect(cssContent).toContain("sans-serif");
  });

  it("should have complete font-family declaration with all fallbacks", () => {
    const cssPath = resolve(__dirname, "../index.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    const expectedFontFamily = "font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;";
    expect(cssContent).toContain(expectedFontFamily);
  });

  it("should apply Space Grotesk to headings", () => {
    const cssPath = resolve(__dirname, "../index.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("font-family: 'Space Grotesk'");
  });

  it("should register both font families as Tailwind font families", () => {
    const configPath = resolve(__dirname, "../../tailwind.config.ts");
    const configContent = readFileSync(configPath, "utf-8");

    expect(configContent).toContain("IBM Plex Sans");
    expect(configContent).toContain("Space Grotesk");
  });
});
