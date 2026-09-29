import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TTLCache } from "../src/services/ttlCache.js";

describe("TTLCache", () => {
  it("returns a stored value before it expires", () => {
    const cache = new TTLCache();
    cache.set("a", 42, 1000);
    assert.equal(cache.get("a"), 42);
  });

  it("returns undefined for a missing key", () => {
    const cache = new TTLCache();
    assert.equal(cache.get("missing"), undefined);
  });

  it("expires a value after its TTL elapses", async () => {
    const cache = new TTLCache();
    cache.set("a", 1, 10);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(cache.get("a"), undefined);
  });

  it("evicts the oldest entry once maxEntries is exceeded", () => {
    const cache = new TTLCache({ maxEntries: 2 });
    cache.set("a", 1, 10000);
    cache.set("b", 2, 10000);
    cache.set("c", 3, 10000); // should evict "a"
    assert.equal(cache.get("a"), undefined);
    assert.equal(cache.get("b"), 2);
    assert.equal(cache.get("c"), 3);
  });

  it("builds a stable key regardless of param order", () => {
    const k1 = TTLCache.key("tool", { city: "Pune", career: "Doctor" });
    const k2 = TTLCache.key("tool", { career: "Doctor", city: "Pune" });
    assert.equal(k1, k2);
  });
});
