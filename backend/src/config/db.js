import mongoose from "mongoose";

/**
 * Connect to MongoDB with lifecycle event handlers.
 * @param {string} uri – MongoDB connection string
 * @returns {Promise<void>}
 */
export async function connectDatabase(uri) {
  const mongoUri = uri || "mongodb://localhost:27017/career-compass";

  // Connection lifecycle events
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed (SIGINT)");
    process.exit(0);
  });

  await mongoose.connect(mongoUri);
}
