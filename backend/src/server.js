import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import { connectDatabase } from "./config/db.js";
import app from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load backend environment variables from this application folder.
dotenv.config({ path: join(__dirname, "..", ".env") });

// Crash early if critical env vars are missing
if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET environment variable must be set");
  process.exit(1);
}

// Connect to MongoDB then start HTTP server
const PORT = process.env.PORT || 4000;

connectDatabase(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
