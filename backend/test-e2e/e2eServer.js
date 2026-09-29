// ─── E2E Server Bootstrap ───────────────────────────────────────────────────
// A separate entrypoint from src/server.js, used ONLY by Playwright's
// webServer config. It intercepts Gemini calls via nock BEFORE the app
// (and therefore geminiService.js) is imported, provisions its own
// throwaway, self-contained in-memory MongoDB (no external DB, no shared
// state with the Playwright process needed), then starts the real Express
// app against it. No other backend code is modified or duplicated — this
// is the same app.js every other test and production run uses.
//
// Self-provisioning the database here (rather than via a Playwright
// globalSetup writing a URI to a file) avoids depending on the exact
// startup ordering between globalSetup and webServer, which varies by
// Playwright version and is easy to get subtly wrong.
//
// NOTE: mongodb-memory-server downloads a real mongod binary on first run
// on a given machine (cached afterward). That download needs normal
// internet access and will NOT succeed in a network-restricted sandbox —
// only on a developer machine or a CI runner with standard egress.

import "./mockGeminiInterceptors.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDatabase } from "../src/config/db.js";
import app from "../src/app.js";

if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET must be set for the E2E server");
  process.exit(1);
}

const PORT = process.env.PORT || 4100;

async function start() {
  const mongod = await MongoMemoryServer.create({ instance: { dbName: "career-compass-e2e" } });
  await connectDatabase(mongod.getUri());
  const server = app.listen(PORT, () => console.log(`🧪 E2E backend server running on port ${PORT}`));

  const shutdown = async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
