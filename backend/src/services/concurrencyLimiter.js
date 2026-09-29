// ─── Concurrency Limiter ────────────────────────────────────────────────────
// Now that every AI feature shares ONE Gemini API key, an unlucky burst of
// traffic (e.g. several users generating roadmaps at once) can trip Google's
// per-key rate limit. This semaphore caps how many Gemini calls are in
// flight at once and queues the rest (FIFO) instead of firing them all and
// hoping — the queued calls simply wait their turn, they don't error out.

export class ConcurrencyLimiter {
  constructor(maxConcurrent = 4) {
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
    this.queue = [];
  }

  async run(task) {
    if (this.active >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await task();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}
