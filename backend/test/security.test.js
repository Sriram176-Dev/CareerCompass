import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../src/middleware/auth.js";

// ─── NoSQL injection protection ────────────────────────────────────────────
// A payload like { "email": { "$ne": null } } sent as JSON must never reach
// a Mongoose query with the "$ne" operator intact — that's how an attacker
// turns User.findOne({ email }) into a match-anything query. These tests
// prove the sanitizer strips it before it reaches route handlers.
describe("NoSQL injection sanitization", () => {
  let server, port;

  beforeEach(async () => {
    const app = express();
    app.use(express.json());
    app.use(mongoSanitize({ replaceWith: "_" }));
    app.post("/echo", (req, res) => res.json({ body: req.body }));
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("strips $-prefixed operator keys from the request body", async () => {
    const res = await fetch(`http://localhost:${port}/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: { $ne: null }, password: "x" }),
    });
    const data = await res.json();
    assert.equal(data.body.email.$ne, undefined, "$ne operator must be stripped");
    assert.ok("_ne" in data.body.email, "operator key should be renamed, not silently dropped without trace");
  });

  it("strips $-prefixed keys used to hijack a resetToken/verifyEmail lookup", async () => {
    const res = await fetch(`http://localhost:${port}/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: { $gt: "" } }),
    });
    const data = await res.json();
    assert.equal(data.body.token.$gt, undefined);
  });

  it("leaves ordinary string values completely untouched", async () => {
    const res = await fetch(`http://localhost:${port}/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@example.com", password: "hunter2" }),
    });
    const data = await res.json();
    assert.equal(data.body.email, "student@example.com");
    assert.equal(data.body.password, "hunter2");
  });
});

// ─── JWT algorithm pinning ──────────────────────────────────────────────────
describe("authMiddleware", () => {
  const OLD_SECRET = process.env.JWT_SECRET;
  beforeEach(() => { process.env.JWT_SECRET = "test-secret-for-jwt-tests"; });
  afterEach(() => { process.env.JWT_SECRET = OLD_SECRET; });

  function mockReqRes(cookieToken) {
    const req = { cookies: { cc_token: cookieToken }, headers: {} };
    let statusCode, body;
    const res = { status(c) { statusCode = c; return this; }, json(b) { body = b; return this; } };
    return { req, res, getResult: () => ({ statusCode, body }) };
  }

  it("accepts a validly signed HS256 token", () => {
    const token = jwt.sign({ userId: "abc123" }, process.env.JWT_SECRET, { algorithm: "HS256" });
    const { req, res, getResult } = mockReqRes(token);
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(req.userId, "abc123");
    assert.equal(getResult().statusCode, undefined);
  });

  it("rejects a token signed with alg 'none' (no signature at all)", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ userId: "attacker" })).toString("base64url");
    const forgedToken = `${header}.${payload}.`;
    const { req, res, getResult } = mockReqRes(forgedToken);
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(getResult().statusCode, 401);
  });

  it("rejects a token with no cookie or Authorization header", () => {
    const { req, res, getResult } = mockReqRes(undefined);
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(getResult().statusCode, 401);
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ userId: "abc123" }, "wrong-secret", { algorithm: "HS256" });
    const { req, res, getResult } = mockReqRes(token);
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(getResult().statusCode, 401);
  });
});
