# API Reference

Base URL: `http://localhost:4000/api` (or `VITE_API_URL`). Auth uses an
HttpOnly cookie set on login — no bearer token to manage client-side.

- [Auth](#auth)
- [Profile](#profile)
- [Tasks](#tasks)
- [AI](#ai) — architecture notes below the endpoint list

---

## Auth
`backend/src/modules/auth`

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | – | `{ email, password, name, user_type }` | Creates user account |
| POST | `/auth/login` | – | `{ email, password }` | Validates credentials, sets HttpOnly session cookie |
| POST | `/auth/logout` | – | – | Clears session cookie |
| GET | `/auth/me` | ✅ | – | Returns current authenticated user |
| POST | `/auth/forgot-password` | – | `{ email }` | Sends password reset email / logs link in DEV |
| POST | `/auth/reset-password` | – | `{ token, password }` | Resets password with valid token |

`POST /auth/login` and `/auth/register` are rate-limited (`authLimiter`, see
`config/security.js`) to slow down credential-stuffing attempts.

## Profile
`backend/src/modules/profile` — all routes require auth.

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/profile` | – | |
| PATCH | `/profile` | partial profile fields | |
| POST | `/profile/add-xp` | `{ amount }` | Returns updated `{ xp, level }` |
| POST | `/profile/chat-session` | `{ session }` | |
| DELETE | `/profile/chat-session/:id` | – | |
| POST | `/profile/flashcard-deck` | `{ deck }` | Atomic push, returns full deck list |
| PATCH | `/profile/flashcard-deck/:id` | `{ progress }` | |

## Tasks
`backend/src/modules/tasks` — all routes require auth.

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/tasks` | – | |
| POST | `/tasks` | `{ text }` | |
| PATCH | `/tasks/:id` | `{ completed?, text? }` | |
| DELETE | `/tasks/:id` | – | |

## AI
`backend/src/modules/ai` — all routes require auth and are additionally
rate-limited (see below).

| Method | Path | Tier | Body | Returns |
|---|---|---|---|---|
| POST | `/ai/chat` | pro (SSE) | `{ messages[], userProfile? }` | `text/event-stream` of `{ text }` chunks, ends with `[DONE]` |
| POST | `/ai/career-analysis` | pro | `{ interestCards, priorityRanking, scenarioAnswers, userDescription, userProfile, topCareers }` — each `topCareers` entry now also carries `desc, skills, strongKeywords` (used only for embeddings, not sent to the generative model as-is) | `{ topCareers: [{ careerId, matchScore, aiReason, semanticScore }], analysis }` |
| POST | `/ai/generate-roadmap` | pro | `{ career, userProfile }` | `{ overview, milestones[], ... }` |
| POST | `/ai/generate-flashcards` | pro | `{ topic, content?, count? }` | `{ flashcards[] }` |
| POST | `/ai/generate-resume` | pro | `{ userProfile, completedTasks, career }` | `{ personalInfo, objective, ... }` |
| POST | `/ai/daily-quiz` | flash | `{ career?, topic?, count? }` | `{ questions[] }` |
| POST | `/ai/study-notes` | pro | `{ topic, content }` | `{ title, summary, keyPoints[], ... }` |
| POST | `/ai/summarize-document` | pro | `{ content, filename }` | `{ title, overview, keyPoints[], ... }` |
| POST | `/ai/career-tools` | pro | `{ tool, ...params }` — `tool` ∈ `interview-questions, salary-insights, career-news, study-plan` | shape depends on `tool` (see `modules/ai/schemas.js`) |

**Rate limits** (per authenticated user, `express-rate-limit`):
- "pro" endpoints: 5 requests / 15 min
- "flash" endpoints (`daily-quiz`): 30 requests / 15 min
- All `/api/ai/*` routes also share a general 30 requests/minute limiter (`config/security.js`)

### AI service architecture

Every AI endpoint above is backed by a single shared `GEMINI_API_KEY` and
routed through `backend/src/services/geminiService.js` rather than calling
`fetch` directly. That service provides, uniformly, for every endpoint:

- **Model tiering** — `tier: "flash"` for cheap/simple generation, `tier: "pro"`
  for reasoning-heavy tasks, both configurable via `GEMINI_MODEL_FLASH` /
  `GEMINI_MODEL_PRO` env vars.
- **Automatic fallback** — if the `pro` model is rate-limited or briefly
  unavailable, the request transparently retries against the `flash` model
  instead of failing.
- **Retry with exponential backoff + jitter** on 429/500/503 and network
  timeouts (see `withRetries` in `geminiService.js`).
- **Schema-validated JSON** — each endpoint declares a Zod schema
  (`modules/ai/schemas.js`). If Gemini's JSON fails validation, the service
  sends the validation errors back to the model for one self-correction
  attempt before giving up.
- **Response caching** — `career-tools` requests for `salary-insights` and
  `career-news` (not user-specific) are cached for 6 hours via an in-memory
  TTL cache, cutting duplicate Gemini calls across users asking about the
  same career.
- **Concurrency limiting** — a semaphore caps in-flight Gemini calls so
  traffic bursts queue instead of tripping the shared key's rate limit.
- **Graceful degradation** — `/ai/career-analysis` specifically: if Gemini
  is unreachable even after retries, the endpoint returns a rule-based
  fallback (derived from the pre-ranked `topCareers` the frontend already
  sent) instead of a 500, so the career quiz never dead-ends.
- **Semantic similarity scoring** — `/ai/career-analysis` additionally
  computes a third, independent score via `services/embeddingService.js`:
  it embeds the student's free-text answer + selected interests, embeds
  each candidate career's description/skills, and returns the cosine
  similarity (0-100) as `semanticScore` alongside the AI's `matchScore`.
  This uses `gemini-embedding-001`, batches every text in the request into
  a **single** `batchEmbedContents` call, and caches each career's
  embedding for 7 days (career descriptions rarely change, so repeat
  requests mostly cost one embedding call — for the user's text — instead
  of N+1). Embedding failures are caught internally and degrade to "no
  semantic score" rather than failing the whole analysis. The frontend
  blends all three signals per the published weights in
  `frontend/src/data/compassScore.ts` (see also the public methodology
  page at `/how-it-works`): 45% AI re-ranking, 35% rule-based keyword
  match, 20% semantic similarity (falls back to a 65/35 AI/rule split if
  embeddings were unavailable for a given request).

### Outcome logging (closing the loop on the Compass Fit Score)

The Compass Fit Score's blend weights (45/35/20) are currently a fixed,
unvalidated heuristic — nobody has checked whether they actually predict
what a student ends up choosing or sticking with. Two fields on the User
model now log the real behavioral signal needed to eventually answer that:

- `career_selection_events` — logged by the frontend (`Results.tsx`) every
  time a student selects a career, capturing that career's rank position
  and its rule/AI/semantic sub-scores at the moment of selection.
- `simulator_results` — logged by the frontend (`DecisionSimulator.tsx`)
  when a student completes a Decision Simulator run, capturing the
  career simulated and their alignment percentage.

Nothing currently reads this data — it's the instrumentation layer that
has to exist before a future analysis can ask "did high-rule-score,
low-AI-score careers get selected more or less often than the blend
implies?" and adjust the weights with evidence instead of a guess.

See `backend/test/geminiService.test.js` for executable specs of the retry,
fallback, and self-correction behavior (`npm run test:backend`).
