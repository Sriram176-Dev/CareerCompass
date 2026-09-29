import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  cosineSimilarity,
  similarityToScore,
  computeSemanticScores,
} from "../src/services/embeddingService.js";

const originalFetch = global.fetch;
const originalKey = process.env.GEMINI_API_KEY;

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.GEMINI_API_KEY = originalKey;
});

function mockBatchEmbed(vectorsByCallOrder) {
  let call = 0;
  global.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body);
    const vectors = vectorsByCallOrder[call++] ?? body.requests.map(() => [0, 0, 1]);
    return {
      ok: true,
      json: async () => ({ embeddings: vectors.map((values) => ({ values })) }),
      text: async () => "",
    };
  };
}

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    assert.equal(cosineSimilarity([1, 0, 0], [1, 0, 0]), 1);
  });

  it("is 0 for orthogonal vectors", () => {
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  });

  it("is -1 for opposite vectors", () => {
    assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
  });

  it("returns 0 for mismatched or missing vectors instead of throwing", () => {
    assert.equal(cosineSimilarity(null, [1, 2]), 0);
    assert.equal(cosineSimilarity([1, 2], [1, 2, 3]), 0);
  });
});

describe("similarityToScore", () => {
  it("maps cosine 1 -> 100 and clamps negatives to 0", () => {
    assert.equal(similarityToScore(1), 100);
    assert.equal(similarityToScore(-0.5), 0);
    assert.equal(similarityToScore(0.5), 50);
  });
});

describe("computeSemanticScores", () => {
  it("returns {} when there is no user text to compare against", async () => {
    const scores = await computeSemanticScores("", [{ id: 1, text: "Software Engineer" }]);
    assert.deepEqual(scores, {});
  });

  it("returns {} when there are no candidate careers", async () => {
    const scores = await computeSemanticScores("I like coding", []);
    assert.deepEqual(scores, {});
  });

  it("scores each career by similarity to the user's text", async () => {
    // user vector matches career A exactly, is orthogonal to career B
    mockBatchEmbed([[[1, 0], [1, 0], [0, 1]]]); // [user, careerA, careerB]
    const scores = await computeSemanticScores("I love writing code", [
      { id: "A", text: "Software Engineer" },
      { id: "B", text: "Chef" },
    ]);
    assert.equal(scores.A, 100);
    assert.equal(scores.B, 0);
  });

  it("never throws — degrades to {} when the embedding API fails", async () => {
    global.fetch = async () => ({ ok: false, status: 500, text: async () => "server error" });
    const scores = await computeSemanticScores("I love writing code", [{ id: "A", text: "Software Engineer" }]);
    assert.deepEqual(scores, {});
  });

  it("caches a career's embedding so a repeat request doesn't re-embed it", async () => {
    let calls = 0;
    global.fetch = async (_url, opts) => {
      calls++;
      const body = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({ embeddings: body.requests.map(() => ({ values: [1, 0] })) }),
        text: async () => "",
      };
    };
    const careers = [{ id: "cached-career", text: "Software Engineer building things" }];
    await computeSemanticScores("I love writing code", careers);
    await computeSemanticScores("I also enjoy building apps", careers);
    // First call embeds [user, career] = 1 request with 2 texts.
    // Second call should only need to embed the new user text (career is cached).
    assert.equal(calls, 2, "two batch requests total, one per unique user text");
  });
});
