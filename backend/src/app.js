import express from "express";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import { corsMiddleware, helmetMiddleware, authLimiter, accountActionLimiter, aiLimiter, generalLimiter } from "./config/security.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/routes.js";
import profileRoutes from "./modules/profile/routes.js";
import taskRoutes from "./modules/tasks/routes.js";
import aiRoutes from "./modules/ai/routes.js";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmetMiddleware);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// ── NoSQL injection protection ────────────────────────────────────────────────
// Strips any request body/query/param keys starting with "$" or containing
// ".", so a payload like { "email": { "$ne": null } } can't be used to turn
// a Mongoose findOne() into an unintended match-anything query — this
// mattered here specifically because auth (login, resetPassword,
// verifyEmail) queries directly on user-supplied fields.
app.use(mongoSanitize({ replaceWith: "_" }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", accountActionLimiter);
app.use("/api/auth/forgot-password", accountActionLimiter);
app.use("/api/ai", aiLimiter);

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

export default app;
