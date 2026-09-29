// ─── E2E Gemini Mock ────────────────────────────────────────────────────────
// The E2E suite exercises the REAL frontend in a REAL browser against the
// REAL backend and a REAL (throwaway, in-memory) MongoDB — the only thing
// mocked is the external Gemini API call itself, intercepted here with nock
// at the Node HTTP layer inside the backend process. This is deliberate:
// we want to prove the actual quiz -> results -> roadmap flow works, without
// spending real API quota or having the suite be flaky because of live LLM
// variance.
//
// Interceptors are matched by inspecting the *request body* (the prompt
// text), not the URL alone, since career-analysis, roadmap generation, and
// embeddings all hit the same generativelanguage.googleapis.com host.

import nock from "nock";

const GEMINI_HOST = "https://generativelanguage.googleapis.com";

function textPart(text) {
  return { candidates: [{ content: { parts: [{ text: JSON.stringify(text) }] } }] };
}

// Matches any :generateContent call for any model (flash, pro, or fallback).
nock(GEMINI_HOST)
  .persist()
  .post(/:generateContent/)
  .reply(200, (uri, requestBody) => {
    const promptText = requestBody?.contents?.[0]?.parts?.[0]?.text || "";

    if (promptText.includes("Career Quiz Analysis") || promptText.includes("CANDIDATE LIST")) {
      // Pull the first two candidate career ids out of the prompt so the
      // response references careers that actually exist in this request,
      // keeping the mock realistic rather than hardcoded to one fixture.
      const idMatches = [...promptText.matchAll(/(\d+):\s/g)].map((m) => Number(m[1]));
      const ids = idMatches.length ? idMatches.slice(0, 3) : [1, 2, 3];
      return textPart({
        topCareers: ids.map((id, i) => ({
          careerId: id,
          matchScore: 90 - i * 10,
          aiReason: `E2E mock reasoning for career ${id} — strong fit based on your quiz answers.`,
        })),
        analysis: {
          strengths: ["Problem solving", "Curiosity"],
          workStyle: "Independent with collaborative bursts",
          recommendedStream: "Science",
          keyInsight: "E2E mock insight: your answers point toward analytical, hands-on work.",
        },
      });
    }

    if (promptText.includes("branching career roadmap") || promptText.includes("Create a 4-6 phase")) {
      return textPart({
        overview: "E2E mock roadmap overview.",
        milestones: [
          {
            id: "m1",
            title: "Foundations",
            description: "Build core fundamentals.",
            duration: "2 months",
            tasks: [
              { id: "t1", title: "Complete intro course", description: "E2E mock task", xp: 20, category: "learning" },
              { id: "t2", title: "Build first project", description: "E2E mock task", xp: 30, category: "practice" },
            ],
          },
          {
            id: "m2",
            title: "Specialization",
            description: "Go deeper.",
            duration: "3 months",
            tasks: [
              { id: "t3", title: "Advanced module", description: "E2E mock task", xp: 25, category: "learning" },
            ],
          },
        ],
      });
    }

    // Generic fallback for any other AI feature hit incidentally during a run.
    return textPart({ message: "E2E mock generic response" });
  });

// Matches the batched embeddings call used for semantic scoring.
nock(GEMINI_HOST)
  .persist()
  .post(/:batchEmbedContents/)
  .reply(200, (uri, requestBody) => {
    const count = requestBody?.requests?.length || 1;
    // Distinct-but-deterministic vectors so cosine similarity math still runs
    // meaningfully rather than comparing identical vectors to themselves.
    const embeddings = Array.from({ length: count }, (_, i) => ({
      values: Array.from({ length: 8 }, (_, j) => Math.sin(i + j)),
    }));
    return { embeddings };
  });

console.log("[e2e] Gemini API mocked via nock — no real API calls will be made.");
