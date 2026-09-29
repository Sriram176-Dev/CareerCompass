import { test, expect, Page } from "@playwright/test";

/**
 * End-to-end test of the actual core user journey:
 *   Sign up -> Onboarding -> Career Quiz -> Results -> Select Career -> Roadmap
 *
 * This runs against the REAL frontend and REAL backend (real Express routes,
 * real Mongoose models, real request/response validation) with only two
 * things swapped out, both intentionally and both documented:
 *   - MongoDB is a throwaway, self-contained in-memory instance
 *     (mongodb-memory-server), not a persistent database.
 *   - The external Gemini API is intercepted with nock (see
 *     backend/test-e2e/mockGeminiInterceptors.js) so the suite doesn't
 *     spend real API quota or become flaky on live LLM variance.
 *
 * Every selector below was taken directly from the real, current component
 * source (UserAuthentication.tsx, Onboarding.tsx, CareerAssessment.tsx,
 * Results.tsx, CareerRoadmap.tsx) at the time this test was written, not
 * guessed — see e2e/README.md for how each one was verified.
 */

function uniqueTestEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function completeOnboarding(page: Page) {
  await expect(page).toHaveURL(/\/onboarding/);
  // Step 1: "Who are you?" — default selection is fine, just advance.
  await page.getByRole("button", { name: "Next →" }).click();
  // Step 2: "Your City" — defaults (CBSE / metro) are fine, just advance.
  await page.getByRole("button", { name: "Next →" }).click();
  // Step 3: "Subjects" — default slider values are fine, just advance.
  await page.getByRole("button", { name: "Next →" }).click();
  // Step 4: "Review" — submit.
  await page.getByRole("button", { name: "Start Career Discovery →" }).click();
}

async function completeQuiz(page: Page) {
  await expect(page).toHaveURL(/\/quiz/);

  // Suppress or dismiss the welcome tour if present
  await page.evaluate(() => localStorage.setItem("hasSeenWelcome", "true"));
  const skipTour = page.getByRole("button", { name: "Skip tour" });
  if (await skipTour.isVisible().catch(() => false)) {
    await skipTour.click();
  }

  // --- Interest Cards tab (default active) ---
  // These 6 labels are all in the "Activities" category, which is the
  // default first category page, so no category-paging is needed.
  const interestLabels = [
    "Writing Code",
    "Drawing & Art",
    "Lab Experiments",
    "Reading Books",
    "Making Music",
    "Cooking",
  ];
  for (const label of interestLabels) {
    await page.getByRole("button", { name: label }).click();
  }

  // --- Scenarios tab ---
  await page.getByRole("button", { name: /🎭 Scenarios/ }).click();
  // There are exactly 10 scenario questions. Clicking an option
  // auto-advances to the next one after ~600ms (see ScenarioTab.tsx), so we
  // just repeatedly click the first visible option in the question card, 10 times.
  for (let i = 0; i < 10; i++) {
    const firstOption = page.locator(".space-y-3 button").first();
    await firstOption.click();
    await page.waitForTimeout(750); // covers the component's own 600ms auto-advance
  }

  // --- Tell AI tab ---
  await page.getByRole("button", { name: /📝 Tell AI/ }).click();
  await page
    .getByPlaceholder("Write about your career dreams, interests, and goals...")
    .fill(
      "I love writing code and figuring out why systems break. I'm curious about how things work under the hood and enjoy solving hard technical problems with a team."
    );

  // (Priorities tab is auto-marked complete regardless of interaction — see
  // CareerAssessment.tsx's tab-completion logic — so it's intentionally
  // skipped here, matching what a real user COULD do, not just what's easy.)

  // The button has a data-tour attribute (used for the app's own onboarding
  // tour), not a data-testid — matching that directly rather than by text,
  // since the visible label ("Discover My Career Path") is more likely to
  // change with copy edits than the tour hook is.
  await page.locator('[data-tour="analyze-btn"]').click();
}

test.describe("Core journey: quiz -> results -> roadmap", () => {
  test("a new student can sign up, complete the quiz, see results, and generate a roadmap", async ({ page }) => {
    // Ensure welcome tour does not block interactive testing
    await page.addInitScript(() => {
      localStorage.setItem("hasSeenWelcome", "true");
    });

    const email = uniqueTestEmail();
    const password = "TestPass123";

    // ── Sign up ──────────────────────────────────────────────────────────
    await page.goto("/auth?tab=signup");
    await page.getByPlaceholder("Full Name").fill("E2E Test Student");
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(password);
    await page.getByPlaceholder("Confirm Password").fill(password);
    await page.getByRole("button", { name: "Create Account" }).click();

    // ── Onboarding ───────────────────────────────────────────────────────
    await completeOnboarding(page);

    // ── Career quiz ──────────────────────────────────────────────────────
    await completeQuiz(page);

    // ── Results ──────────────────────────────────────────────────────────
    await expect(page).toHaveURL(/\/results/, { timeout: 15_000 });

    // Open the top career's detail modal and select it.
    await page.locator("h3").first().click();

    // The explainable score breakdown should render in the modal for the top match.
    await expect(page.getByText(/% Compass Fit/).first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /Select This Career & Get Roadmap/ }).click();

    // ── Roadmap ──────────────────────────────────────────────────────────
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page.locator("h1")).toBeVisible();

    await page.getByRole("button", { name: "Generate AI Roadmap" }).click();

    // The mocked roadmap response includes a "Foundations" milestone —
    // confirms the AI response was parsed, validated, and rendered, not
    // just that the page loaded.
    await expect(page.getByText("Foundations")).toBeVisible({ timeout: 15_000 });
  });
});
