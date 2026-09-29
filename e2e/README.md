# E2E Tests — Quiz → Results → Roadmap

A real Playwright test of the actual core user journey, running against the
real frontend and real backend — not a mock of the UI, and not a unit test
pretending to be an integration test.

## What's real, what's not

| Layer | Status |
|---|---|
| Frontend | **Real.** The actual React app (`npm run dev`), same code that ships. |
| Backend | **Real.** The actual Express app, actual Mongoose models, actual route handlers, actual Zod validation. |
| Database | **Mocked, but honestly.** A throwaway, self-contained in-memory MongoDB (`mongodb-memory-server`), not a persistent database — provisioned fresh by `backend/test-e2e/e2eServer.js` on each run. |
| Gemini API | **Mocked.** Intercepted at the Node HTTP layer with `nock` (`backend/test-e2e/mockGeminiInterceptors.js`), matched by inspecting the actual prompt text so different AI features get different, realistic canned responses. This avoids spending real API quota and avoids the suite being flaky because of live LLM variance — the same reasoning used for the mocked-fetch unit tests elsewhere in this repo. |

Every mocked AI response is validated against the **real, production Zod
schemas** (`careerAnalysisSchema`, `roadmapSchema`) before being treated as
trustworthy fixture data — see the verification note at the bottom of this
file.

## Why this can't run in every environment

This suite needs two things that require normal, unrestricted internet
access the *first* time they run on a machine (both are cached afterward):

1. **A real browser.** `npx playwright install chromium` downloads a
   Chromium build from Playwright's own CDN.
2. **A real MongoDB binary.** `mongodb-memory-server` downloads a `mongod`
   binary from MongoDB's official distribution server the first time it
   runs.

Neither of those hosts is reachable from a network-restricted sandbox (like
the one this suite was originally written in) — only from a normal
developer machine or a standard CI runner. **This test suite was written
and its logic was verified as thoroughly as possible without a browser or a
real MongoDB available — see "What was actually verified" below — but the
full click-through-a-real-browser run has not been executed.** Run it
yourself once you have this checked out with normal internet access, and
you should expect it to either pass outright or surface one or two selector
mismatches from parts of the flow that couldn't be double-checked as
carefully (noted inline in `quiz-to-roadmap.spec.ts`).

## Running it

```bash
# One-time setup
npx playwright install chromium

# Run
npm run test:e2e

# Debug interactively (opens Playwright's UI mode)
npm run test:e2e:ui
```

No `.env` setup needed — the backend E2E server (`backend/test-e2e/e2eServer.js`)
provisions its own database and receives a dummy `GEMINI_API_KEY` (unused,
since nock intercepts every call) via `playwright.config.ts`.

## What was actually verified, without a browser or real MongoDB

- Every DOM selector in `quiz-to-roadmap.spec.ts` (button text, placeholders,
  element ids) was taken directly from the real, current component source —
  not guessed — by reading `UserAuthentication.tsx`, `Onboarding.tsx`,
  `CareerAssessment.tsx`, `ScenarioTab.tsx`, `TellAITab.tsx`, `Results.tsx`,
  and `CareerRoadmap.tsx` at the time this was written.
- The nock interceptors were executed for real, with real `fetch()` calls
  shaped exactly like `geminiService.js`'s and `embeddingService.js`'s
  actual requests (same URL pattern, same body shape) — confirmed to
  return valid, parseable responses.
- Those mocked responses were validated against the real production
  `careerAnalysisSchema` and `roadmapSchema` Zod schemas and passed.
- `@playwright/test`, `mongodb-memory-server`, and `nock` were all
  installed successfully and resolve correctly in the dependency tree.
- All new/changed backend and config files pass `node --check` (syntax
  validity).

What was **not** verified: an actual browser clicking through the actual
running app end-to-end. That's the one honest gap — flagged rather than
glossed over.
