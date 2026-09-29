/**
 * Centralized error-handling middleware.
 * Must be registered AFTER all routes (Express requires 4-arg signature).
 */
export function errorHandler(err, _req, res, _next) {
  console.error("🔥 Unhandled error:", err.message || err);

  const status = err.statusCode || err.status || 500;
  const message = err.expose ? err.message : "Internal server error";

  res.status(status).json({ error: message });
}
