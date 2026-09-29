// ─── Embedding Service ──────────────────────────────────────────────────────
// Adds a third, independent scoring signal to career matching: semantic
// similarity between what the student actually wrote/selected and each
// career's description, via vector embeddings. This is deterministic,
// cheap, cacheable, and captures nuance the hand-authored keyword table
// (cardWeights.ts) can't — e.g. "I like figuring out why systems break"
// should pull toward Cybersecurity even with zero keyword overlap.
//
// Design notes:
//   - Uses gemini-embedding-001 (GA), batched in ONE request per analysis
//     (batchEmbedContents) rather than one call per career.
//   - Career embeddings are cached for 7 days, keyed by a hash of their
//     text — career descriptions barely change, so after the first user
//     of the day, most careers cost zero extra API calls.
//   - The user's own text is always re-embedded (it's unique every time).
//   - Failure here must never break career analysis as a whole: every
//     entry point catches and degrades to "no semantic score" rather than
//     throwing, so a flaky embeddings call can't take down the quiz.

import crypto from "node:crypto";
import { GeminiError, withRetries, getApiKey } from "./geminiService.js";
import { TTLCache } from "./ttlCache.js";
import { ConcurrencyLimiter } from "./concurrencyLimiter.js";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const OUTPUT_DIMENSIONALITY = Number(process.env.GEMINI_EMBEDDING_DIM) || 768;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const careerEmbeddingCache = new TTLCache({ maxEntries: 1000 });
const limiter = new ConcurrencyLimiter(Number(process.env.GEMINI_MAX_CONCURRENCY) || 4);

function hashText(text) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 16);
}

function isRetriableStatus(status) {
  return status === 429 || status === 500 || status === 503;
}

/** One batched call: embeds N texts in a single request. Order-preserving. */
async function embedBatch(texts) {
  if (texts.length === 0) return [];

  return limiter.run(() =>
    withRetries(async () => {
      const res = await fetch(`${API_BASE}/${EMBEDDING_MODEL}:batchEmbedContents?key=${getApiKey()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text: text.slice(0, 8000) }] },
            outputDimensionality: OUTPUT_DIMENSIONALITY,
            taskType: "SEMANTIC_SIMILARITY",
          })),
        }),
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new GeminiError(`Embedding request failed (${res.status}): ${bodyText.slice(0, 200)}`, {
          status: res.status,
          retriable: isRetriableStatus(res.status),
        });
      }

      const data = await res.json();
      const vectors = data.embeddings?.map((e) => e.values);
      if (!vectors || vectors.length !== texts.length) {
        throw new GeminiError("Embedding response was missing or malformed vectors.", { retriable: true });
      }
      return vectors;
    })
  );
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Cosine similarity, clamped and rescaled to a 0-100 "match" score. */
export function similarityToScore(cosine) {
  return Math.round(Math.max(0, Math.min(1, cosine)) * 100);
}

/**
 * Compute a 0-100 semantic-similarity score between `userText` and each
 * career's text. Returns { [careerId]: score }. Never throws — on any
 * failure it returns {} so callers can treat semantic scoring as optional.
 *
 * @param {string} userText - free text + selected interests/priorities
 * @param {{ id: string|number, text: string }[]} careers
 */
export async function computeSemanticScores(userText, careers) {
  const trimmedUserText = (userText || "").trim();
  if (!trimmedUserText || !careers?.length) return {};

  try {
    const toFetch = [{ key: "__user__", text: trimmedUserText }];
    const cacheHits = {};

    for (const career of careers) {
      const cacheKey = `career:${career.id}:${hashText(career.text)}`;
      const cached = careerEmbeddingCache.get(cacheKey);
      if (cached) cacheHits[career.id] = cached;
      else toFetch.push({ key: career.id, text: career.text, cacheKey });
    }

    const vectors = await embedBatch(toFetch.map((t) => t.text));
    const embeddings = { ...cacheHits };
    toFetch.forEach((t, i) => {
      embeddings[t.key] = vectors[i];
      if (t.cacheKey) careerEmbeddingCache.set(t.cacheKey, vectors[i], SEVEN_DAYS_MS);
    });

    const userVector = embeddings.__user__;
    const scores = {};
    for (const career of careers) {
      const vec = embeddings[career.id];
      if (vec) scores[career.id] = similarityToScore(cosineSimilarity(userVector, vec));
    }
    return scores;
  } catch (err) {
    console.error("[embeddings] semantic scoring skipped:", err.message);
    return {};
  }
}
