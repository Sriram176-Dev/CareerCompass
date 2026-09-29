// ─── TTL Cache ────────────────────────────────────────────────────────────
// A tiny dependency-free in-memory cache with per-entry expiry.
// Used to stop the same career/topic/tool request from re-hitting the
// (single, shared) Gemini API key every time — cuts quota usage and
// latency for anything that isn't uniquely personal to one user.

export class TTLCache {
  constructor({ maxEntries = 500 } = {}) {
    this.maxEntries = maxEntries;
    this.store = new Map(); // key -> { value, expiresAt }
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // refresh recency for simple LRU-ish eviction
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Build a stable cache key from a namespace + arbitrary params object. */
  static key(namespace, params) {
    const sorted = Object.keys(params || {})
      .sort()
      .reduce((acc, k) => {
        acc[k] = params[k];
        return acc;
      }, {});
    return `${namespace}:${JSON.stringify(sorted)}`;
  }
}
