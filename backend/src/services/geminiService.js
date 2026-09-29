// ─── Gemini Service ─────────────────────────────────────────────────────────
// Single source of truth for talking to Google's Gemini API.
//
// Why this exists: the old code asked for 9 separate API keys (one per
// feature) and duplicated the same fetch/parse logic nine times, with zero
// retry logic — a single 429 just became a 500 to the user. This module
// replaces all of that with:
//   - ONE api key (GEMINI_API_KEY)
//   - a two-tier model strategy (fast/cheap "flash" vs. "pro" for reasoning),
//     with automatic pro -> flash fallback if the pro model is unavailable
//   - exponential backoff + jitter retries on 429 / 5xx / network errors
//   - a concurrency limiter so one shared key doesn't get hammered
//   - an optional TTL cache for requests that aren't unique-per-user
//   - JSON extraction + (optional) zod schema validation with one
//     self-correction retry if the model returns malformed JSON

import { TTLCache } from "./ttlCache.js";
import { ConcurrencyLimiter } from "./concurrencyLimiter.js";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Gemini 1.5 is fully retired; Gemini 2.5 is stable but scheduled to sunset
// Oct 16 2026. Default to the Gemini 3 line, overridable via env so a model
// swap never requires a code change.
export const MODELS = {
  flash: process.env.GEMINI_MODEL_FLASH || "gemini-3.1-flash-lite",
  pro: process.env.GEMINI_MODEL_PRO || "gemini-3-flash-preview",
};

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 600;

const cache = new TTLCache({ maxEntries: 500 });
const limiter = new ConcurrencyLimiter(Number(process.env.GEMINI_MAX_CONCURRENCY) || 4);

export class GeminiError extends Error {
  constructor(message, { status, retriable = false } = {}) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.retriable = retriable;
  }
}

export function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiError(
      "GEMINI_API_KEY is not configured. Add a single key to backend/.env (see .env.example)."
    );
  }
  return key;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriable(status) {
  return status === 429 || status === 500 || status === 503;
}

/** One raw call to a specific Gemini model. Throws GeminiError on failure. */
async function callModel({ model, contents, systemInstruction, temperature, maxTokens, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${getApiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents,
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new GeminiError(`Gemini ${model} responded ${res.status}: ${bodyText.slice(0, 300)}`, {
        status: res.status,
        retriable: isRetriable(res.status),
      });
    }

    const data = await res.json();
    if (data.error) throw new GeminiError(data.error.message, { retriable: false });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = data.candidates?.[0]?.finishReason;
    if (!text) {
      throw new GeminiError(`Empty response from ${model} (finishReason: ${finishReason || "unknown"})`, {
        retriable: true,
      });
    }
    return text;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new GeminiError(`Gemini ${model} timed out after ${timeoutMs}ms`, { retriable: true });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function withRetries(fn, { retries = MAX_RETRIES } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retriable = err instanceof GeminiError ? err.retriable : true;
      if (!retriable || attempt === retries) break;
      const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 250;
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Generate text from Gemini with retries, tiering, and an optional cache.
 * tier: "flash" (cheap/fast) or "pro" (better reasoning, falls back to flash).
 */
export async function generateContent({
  prompt,
  systemInstruction,
  tier = "pro",
  temperature = 0.3,
  maxTokens = 8192,
  timeoutMs = 30000,
  cacheKey = null,
  cacheTtlMs = 0,
}) {
  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit !== undefined) return hit;
  }

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const primaryModel = MODELS[tier] || MODELS.pro;

  const result = await limiter.run(() =>
    withRetries(async () => {
      try {
        return await callModel({ model: primaryModel, contents, systemInstruction, temperature, maxTokens, timeoutMs });
      } catch (err) {
        // If the "pro" model is unavailable/overloaded, gracefully step down
        // to flash rather than failing the whole request.
        if (tier === "pro" && err instanceof GeminiError && err.retriable) {
          return await callModel({ model: MODELS.flash, contents, systemInstruction, temperature, maxTokens, timeoutMs });
        }
        throw err;
      }
    })
  );

  if (cacheKey && cacheTtlMs > 0) cache.set(cacheKey, result, cacheTtlMs);
  return result;
}

/** Strips markdown code fences and extracts the first valid JSON value found. */
export function extractJSON(raw) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {}
  }
  throw new GeminiError("Could not extract valid JSON from the AI response.");
}

/**
 * Generate JSON and, if a zod schema is given, validate it — with ONE
 * self-correction retry (telling the model exactly what was wrong) before
 * giving up. This turns "the model returned slightly malformed JSON" from a
 * hard failure into a recoverable one.
 */
export async function generateJSON({ schema, ...options }) {
  const raw = await generateContent(options);
  let parsed = extractJSON(raw);

  if (!schema) return parsed;

  const first = schema.safeParse(parsed);
  if (first.success) return first.data;

  // Self-correction pass: ask the model to fix its own output against the
  // validation errors, rather than failing the request outright.
  const issues = first.error.issues.slice(0, 8).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
  const correctionPrompt = `Your previous JSON response had validation errors: ${issues}.\n\nHere is the response you gave:\n${raw}\n\nReturn ONLY corrected, valid JSON matching the required shape — no prose, no markdown fences.`;

  const retryRaw = await generateContent({ ...options, prompt: correctionPrompt, cacheKey: null });
  parsed = extractJSON(retryRaw);
  const second = schema.safeParse(parsed);
  if (second.success) return second.data;

  throw new GeminiError(`AI response failed schema validation twice: ${issues}`);
}

/** Streaming variant for the chat feature (Server-Sent Events passthrough). */
export async function streamContent({ contents, systemInstruction, temperature = 0.7, maxTokens = 8192, tier = "pro" }) {
  const model = MODELS[tier] || MODELS.pro;
  const url = `${API_BASE}/${model}:streamGenerateContent?alt=sse&key=${getApiKey()}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new GeminiError(`Gemini ${model} stream responded ${res.status}: ${bodyText.slice(0, 300)}`, {
      status: res.status,
    });
  }
  return res.body;
}

export function sanitizeInput(str, maxLength = 2000) {
  if (typeof str !== "string") return str;
  return str
    .replace(/ignore (all )?previous instructions/gi, "[blocked]")
    .replace(/system prompt/gi, "[blocked]")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .slice(0, maxLength)
    .trim();
}
