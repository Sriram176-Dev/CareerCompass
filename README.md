# Career Compass

Career Compass is organized as a two-application monorepo:

```text
career-compass/
├── frontend/   # Vite + React client
├── backend/    # Express + MongoDB API
└── docs/       # Architecture and API documentation
```

## Requirements

- Node.js 20 or newer
- MongoDB

## Configuration

Create or update these files:

- `frontend/.env.local` for `VITE_API_URL`
- `backend/.env` for `MONGODB_URI`, `JWT_SECRET`, and server settings

## Development

Install dependencies:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

Run both applications:

```bash
npm run dev
```

Run them independently:

```bash
npm run dev:frontend
npm run dev:backend
```

The frontend runs at `http://localhost:8080` and the backend health endpoint is available at `http://localhost:4000/api/health`.

## Validation

```bash
npm run build
npm run lint
npm test              # frontend (Vitest) + backend (node:test)
npm run test:backend  # backend AI-service tests only
```

## End-to-end tests

A real Playwright suite covers the core journey (sign up → onboarding →
quiz → results → select career → roadmap) against the real frontend and
real backend. See [`e2e/README.md`](e2e/README.md) for exactly what's real
versus intentionally mocked (a throwaway in-memory database, and the
external Gemini API), and why.

```bash
npx playwright install chromium   # one-time
npm run test:e2e
```

Runs automatically on every push via [`.github/workflows/ci.yml`](.github/workflows/ci.yml),
alongside lint, typecheck, build, and both unit test suites.

## Documentation

- [`docs/API.md`](docs/API.md) — every REST endpoint, request/response
  shapes, rate limits, and the AI service architecture (single Gemini key,
  model tiering with automatic fallback, retries, schema validation,
  caching, graceful degradation).

## AI setup

All AI features share **one** Gemini API key. Get a free key at
[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and
set `GEMINI_API_KEY` in `backend/.env` (see `backend/.env.example`).
