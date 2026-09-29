import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the real quiz -> results -> roadmap flow.
 *
 * Starts TWO real dev servers:
 *   1. The real backend (`backend/test-e2e/e2eServer.js`) — the actual
 *      Express app, actual Mongoose models, actual route handlers. The only
 *      thing swapped out is (a) a throwaway in-memory MongoDB instead of a
 *      real deployment's database, and (b) the external Gemini API, mocked
 *      via nock so the suite doesn't spend real API quota or become flaky
 *      on live LLM variance.
 *   2. The real frontend (`npm run dev` in frontend/), pointed at that
 *      backend via VITE_API_URL.
 *
 * Requires normal internet access to run (to download a browser via
 * `npx playwright install chromium` and a mongod binary via
 * mongodb-memory-server, both one-time, cached afterward) — see
 * e2e/README.md for the honest story on why this can't run in every
 * sandboxed environment.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // each test creates/uses real user accounts against a shared in-memory DB
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,

  use: {
    baseURL: "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: [
    {
      command: "node test-e2e/e2eServer.js",
      cwd: "./backend",
      port: 4100,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        JWT_SECRET: "e2e-test-secret-not-for-production",
        GEMINI_API_KEY: "e2e-dummy-key-unused-nock-intercepts-all-calls",
        NODE_ENV: "test",
      },
    },
    {
      command: "npm run dev",
      cwd: "./frontend",
      port: 8080,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: "http://localhost:4100/api",
      },
    },
  ],
});
