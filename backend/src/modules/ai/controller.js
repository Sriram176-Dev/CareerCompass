import rateLimit from "express-rate-limit";
import { generateJSON, streamContent, sanitizeInput, GeminiError } from "../../services/geminiService.js";
import { computeSemanticScores } from "../../services/embeddingService.js";
import { TTLCache } from "../../services/ttlCache.js";
import {
  careerAnalysisSchema,
  roadmapSchema,
  flashcardsSchema,
  resumeSchema,
  quizSchema,
  studyNotesSchema,
  summarizeSchema,
  interviewQuestionsSchema,
  salaryInsightsSchema,
  careerNewsSchema,
  studyPlanSchema,
  decisionSimulatorSchema,
  roadmapRebalanceSchema,
} from "./schemas.js";
import {
  chatSystemPrompt,
  careerAnalysisPrompt,
  roadmapPrompt,
  flashcardsPrompt,
  resumePrompt,
  dailyQuizPrompt,
  studyNotesPrompt,
  summarizePrompt,
  careerToolPrompt,
} from "./prompts.js";
import { buildUserSemanticText, buildCareerSemanticText } from "./semanticText.js";

// ─── Tiered Rate Limiting ─────────────────────────────────────────────────────
// Pro (reasoning) features: 5 requests / 15 min per user.
export const aiProLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.userId,
  message: { error: "You've reached the limit for advanced AI features. Please try again in 15 minutes." },
});

// Flash (cheap) features: 30 requests / 15 min per user.
export const aiFlashLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId,
  message: { error: "Too many quiz requests. Please slow down." },
});

// Content shared across many users (salary data, field news) doesn't need to
// be regenerated per-request — cache it for a while to save quota + latency.
const SIX_HOURS = 6 * 60 * 60 * 1000;
const toolCache = new TTLCache({ maxEntries: 200 });

function handleAiError(res, err, fallback) {
  console.error("[ai]", err.message);
  if (fallback) return res.json(fallback);
  const status = err instanceof GeminiError && err.status ? 502 : 500;
  res.status(status).json({ error: err.message || "AI request failed. Please try again." });
}

// ─── 1. AI Chat (streaming SSE) ──────────────────────────────────────────────
export async function chat(req, res) {
  try {
    const { messages, userProfile } = req.body;
    const systemPrompt = chatSystemPrompt(userProfile);

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood! I'm ready to help." }] },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: sanitizeInput(m.content, 4000) }],
      })),
    ];

    const body = await streamContent({ contents, tier: "pro", temperature: 0.7 });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          res.write("data: [DONE]\n\n");
          continue;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        } catch {}
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[ai:chat]", err.message);
    if (!res.headersSent) res.status(502).json({ error: "The AI chat service is unavailable right now." });
    else res.end();
  }
}

// ─── 2. Career Analysis ───────────────────────────────────────────────────────
// Three independent scoring signals feed the final match, each computed a
// different way so their blind spots don't overlap:
//   1. Rule-based score (computed by the frontend from cardWeights.ts)
//   2. AI re-ranking + reasoning (Gemini generation, schema-validated)
//   3. Semantic similarity (Gemini embeddings — cosine similarity between
//      the student's own words/interests and each career's description)
// (1) arrives pre-computed in `topCareers`; this endpoint computes (2) and
// (3) in parallel and returns both, so the frontend can blend all three and
// show an explainable breakdown instead of one opaque number. If Gemini is
// down entirely, we fall back to (1) alone rather than 500ing the quiz.
export async function careerAnalysis(req, res) {
  const { interestCards, priorityRanking, scenarioAnswers, userDescription, userProfile, topCareers } = req.body;

  const fallback = {
    topCareers: (topCareers || []).map((c, i) => ({
      careerId: c.id,
      matchScore: Math.max(50, 90 - i * 8),
      aiReason: "Matched based on your quiz answers (AI explanation unavailable right now).",
      semanticScore: null,
    })),
    analysis: {
      strengths: [],
      workStyle: "",
      recommendedStream: "",
      keyInsight: "Your top matches are based on your interests and priorities from the quiz.",
    },
  };

  try {
    const prompt = careerAnalysisPrompt({ interestCards, priorityRanking, scenarioAnswers, userDescription, userProfile, topCareers });

    const userSemanticText = buildUserSemanticText({ interestCards, userDescription, priorityRanking });
    const careerSemanticInputs = (topCareers || []).map((c) => ({ id: c.id, text: buildCareerSemanticText(c) }));

    // Run the (expensive, rate-limited) generation call and the (cheap,
    // cacheable) embedding call concurrently — they're independent.
    const [aiOutcome, semanticScores] = await Promise.all([
      generateJSON({ prompt, tier: "pro", temperature: 0.1, schema: careerAnalysisSchema }),
      computeSemanticScores(userSemanticText, careerSemanticInputs), // never throws, see embeddingService.js
    ]);

    aiOutcome.topCareers = aiOutcome.topCareers.map((c) => ({
      ...c,
      semanticScore: semanticScores[c.careerId] ?? null,
    }));

    res.json(aiOutcome);
  } catch (err) {
    handleAiError(res, err, fallback);
  }
}

// ─── 3. Generate Roadmap ──────────────────────────────────────────────────────
export async function generateRoadmap(req, res) {
  try {
    const { career, userProfile } = req.body;
    const prompt = roadmapPrompt({ career, userProfile });
    const result = await generateJSON({ prompt, tier: "pro", temperature: 0.2, schema: roadmapSchema });
    res.json(result);
  } catch (err) {
    handleAiError(res, err);
  }
}

// ─── 4. Generate Flashcards ───────────────────────────────────────────────────
export async function generateFlashcards(req, res) {
  try {
    const { topic, content, count = 15 } = req.body;
    const prompt = flashcardsPrompt({ topic, content, count });
    const result = await generateJSON({ prompt, tier: "pro", temperature: 0.3, schema: flashcardsSchema });
    res.json(result);
  } catch (err) {
    handleAiError(res, err);
  }
}

// ─── 5. Generate Resume ───────────────────────────────────────────────────────
export async function generateResume(req, res) {
  try {
    const { userProfile, completedTasks, career } = req.body;
    const prompt = resumePrompt({ userProfile, completedTasks, career });
    const result = await generateJSON({ prompt, tier: "pro", temperature: 0.3, schema: resumeSchema });
    res.json(result);
  } catch (err) {
    handleAiError(res, err);
  }
}

// ─── 6. Daily Quiz ────────────────────────────────────────────────────────────
export async function dailyQuiz(req, res) {
  try {
    const { career, topic, count = 5 } = req.body;
    const prompt = dailyQuizPrompt({ career, topic, count });
    const result = await generateJSON({ prompt, tier: "flash", temperature: 0.4, maxTokens: 8192, schema: quizSchema });
    res.json(result);
  } catch (err) {
    handleAiError(res, err);
  }
}

// ─── 7. Study Notes ───────────────────────────────────────────────────────────
export async function studyNotes(req, res) {
  try {
    const { topic, content } = req.body;
    const prompt = studyNotesPrompt({ topic, content });
    const result = await generateJSON({ prompt, tier: "pro", temperature: 0.3, schema: studyNotesSchema });
    res.json(result);
  } catch (err) {
    handleAiError(res, err);
  }
}

// ─── 8. Summarize Document ────────────────────────────────────────────────────
export async function summarizeDocument(req, res) {
  try {
    const { content, filename } = req.body;
    const prompt = summarizePrompt({ content, filename });
    const result = await generateJSON({ prompt, tier: "pro", temperature: 0.2, schema: summarizeSchema });
    res.json(result);
  } catch (err) {
    handleAiError(res, err);
  }
}

// ─── 9. Career Tools ──────────────────────────────────────────────────────────
const TOOL_SCHEMAS = {
  "interview-questions": interviewQuestionsSchema,
  "salary-insights": salaryInsightsSchema,
  "career-news": careerNewsSchema,
  "study-plan": studyPlanSchema,
  "decision-simulator": decisionSimulatorSchema,
  "roadmap-rebalance": roadmapRebalanceSchema,
};

// Which tools are safe to cache (same answer for everyone asking about the
// same career, not tied to a specific user's data). Decision Simulator is
// deliberately NOT here — its whole premise is "try again, see a different
// scenario," so caching it identically for every student/replay would
// silently break the feature.
const CACHEABLE_TOOLS = new Set(["salary-insights", "career-news"]);

// Tools where variety across repeated calls matters more than determinism.
const HIGH_VARIETY_TOOLS = new Set(["decision-simulator"]);

export async function careerTools(req, res) {
  try {
    const { tool, ...params } = req.body;
    const prompt = careerToolPrompt(tool, params);
    if (!prompt) return res.status(400).json({ error: "Unknown tool" });

    const cacheKey = CACHEABLE_TOOLS.has(tool) ? TTLCache.key(tool, params) : null;
    if (cacheKey) {
      const cached = toolCache.get(cacheKey);
      if (cached) return res.json(cached);
    }

    const result = await generateJSON({
      prompt,
      tier: "pro",
      temperature: HIGH_VARIETY_TOOLS.has(tool) ? 0.9 : 0.5,
      schema: TOOL_SCHEMAS[tool],
    });

    if (cacheKey) toolCache.set(cacheKey, result, SIX_HOURS);
    res.json(result);
  } catch (err) {
    handleAiError(res, err);
  }
}
