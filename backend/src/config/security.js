import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ── CORS Configuration ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:4173"
].filter(Boolean);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});

// ── Helmet (Security Headers) ──────────────────────────────────────────────────
export const helmetMiddleware = helmet();

// ── Rate Limiters ──────────────────────────────────────────────────────────────

/** Login: strict — 10 attempts per 15 minutes per IP. Brute-force protection
 *  on login matters more than on register, since a successful guess here
 *  means account takeover, not just a wasted signup slot. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

/** Register/password-reset requests: looser — 20 per 15 minutes per IP.
 *  Still limited (prevents signup spam / reset-email flooding), but shared
 *  IPs (school/office networks) are more likely to hit this legitimately. */
export const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});

/** AI: per-IP — 30 requests per minute */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please slow down." },
});

/** General API: 200 requests per minute */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
