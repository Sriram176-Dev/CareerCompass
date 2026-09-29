import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ConcurrencyLimiter } from "../src/services/concurrencyLimiter.js";

describe("ConcurrencyLimiter", () => {
  it("runs tasks below the limit immediately, in parallel", async () => {
    const limiter = new ConcurrencyLimiter(2);
    let concurrentCount = 0;
    let maxConcurrent = 0;

    const task = () =>
      limiter.run(async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise((r) => setTimeout(r, 20));
        concurrentCount--;
      });

    await Promise.all([task(), task(), task(), task()]);
    assert.equal(maxConcurrent, 2, "never more than 2 tasks should run at once");
  });

  it("queues excess tasks and runs them strictly one at a time when limit is 1", async () => {
    const limiter = new ConcurrencyLimiter(1);
    const order = [];

    const task = (label) =>
      limiter.run(async () => {
        order.push(`start:${label}`);
        await new Promise((r) => setTimeout(r, 10));
        order.push(`end:${label}`);
      });

    await Promise.all([task("A"), task("B")]);
    // With concurrency 1, B must not start until A has fully finished.
    assert.deepEqual(order, ["start:A", "end:A", "start:B", "end:B"]);
  });

  it("propagates a task's thrown error without deadlocking the queue", async () => {
    const limiter = new ConcurrencyLimiter(1);
    await assert.rejects(() => limiter.run(async () => { throw new Error("boom"); }), /boom/);
    // The limiter must release its slot even after a failure.
    const result = await limiter.run(async () => "still works");
    assert.equal(result, "still works");
  });
});
