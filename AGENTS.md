# Career Compass — Agent Context

## What this is
An AI-powered career guidance platform for Indian students (JEE/NEET/UPSC-adjacent
context): interest quiz -> AI-matched careers -> AI-generated roadmap -> gamified
study tools (XP, streaks, daily quiz, flashcards). MERN-ish stack: React + Vite +
TypeScript frontend, Express + MongoDB (Mongoose) backend, JWT-in-HttpOnly-cookie auth.

## Key architectural decisions (don't relitigate these without reason)
- ONE shared Gemini API key (`GEMINI_API_KEY`), routed through
  `backend/src/services/geminiService.js` — model tiering (flash/pro) with automatic
  pro->flash fallback, exponential backoff + jitter retries, Zod schema validation
  with a self-correction retry, TTL caching, a concurrency limiter. Every AI feature
  in `backend/src/modules/ai/controller.js` goes through this service — do not add a
  new direct `fetch()` call to Gemini anywhere else.
- Career matching ("Compass Fit Score") blends THREE independent signals, weights
  published in `frontend/src/data/compassScore.ts`: 35% rule-based keyword match
  (`frontend/src/data/cardWeights.ts`), 45% AI re-ranking, 20% semantic similarity
  via embeddings (`backend/src/services/embeddingService.js`, gemini-embedding-001,
  batched calls, 7-day cache). Falls back to 65/35 AI/rule if embeddings fail.
  Public methodology page at `/how-it-works`.
- Outcome logging exists but is NOT yet analyzed: `career_selection_events` and
  `simulator_results` on the User model (`backend/src/models/User.js`) log real
  behavioral data meant to eventually validate/recalibrate the score weights above.
- Design tokens are centralized in `frontend/src/index.css` (HSL CSS custom
  properties) + `frontend/tailwind.config.ts` — change values there, not per-component,
  to keep the whole app's look consistent. Fonts: Space Grotesk (headings) + IBM
  Plex Sans (body).

## Current verified state (as of last session)
- Backend tests: all passing (`cd backend && npm test`, Node's built-in `node:test`,
  zero extra test-runner dependency).
- Frontend tests: 99/99 passing (`cd frontend && npm test -- --run`, Vitest).
- `npm audit`: 0 vulnerabilities in backend.
- Production build (`cd frontend && npm run build`) succeeds cleanly.
- Playwright E2E suite (`npm run test:e2e`) runs in Chromium and passes end-to-end.

## Known, deliberately-not-yet-fixed gaps (see prompts below)
- Only IP-based rate limiting on login (`backend/src/config/security.js`) — no
  per-account brute-force lockout.
- `forgotPassword` has a timing side-channel: responds near-instantly for a
  non-existent email, slower for a real one (token gen + email send only happen
  in the latter case).
- `frontend/src/components/*.tsx` has several one-line re-export shims pointing at
  `frontend/src/features/**` — a half-finished folder migration.
- Never deployed anywhere. Everything above was verified in a sandbox, never run
  in front of a real user.

## How to work in this codebase
- Every change should be verified with a REAL command run, not assumed: run the
  actual test suite, run the actual build, and report the actual pass/fail count —
  don't say "this should work now" without running it.
- Backend tests: Node's built-in `node:test` (`backend/test/*.test.js`), mocking
  `global.fetch` at the HTTP layer for anything touching Gemini — never mock your
  own service functions, mock the network boundary.
- Prefer editing the shared token/service files over one-off per-component fixes
  when a change should cascade app-wide.