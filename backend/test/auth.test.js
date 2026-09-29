import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/User.js";

process.env.JWT_SECRET = "auth-test-jwt-secret-key";

describe("Auth Controller & Routes", () => {
  let mongod;
  let server;
  let baseUrl;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/auth`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user successfully", async () => {
      const res = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newstudent@example.com",
          password: "password123",
          name: "New Student",
          user_type: "school_student",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.message, "Registration successful");

      const savedUser = await User.findOne({ email: "newstudent@example.com" });
      assert.ok(savedUser);
      assert.equal(savedUser.name, "New Student");
      assert.notEqual(savedUser.password, "password123", "password must be hashed");
    });

    it("rejects duplicate email with 409", async () => {
      const res = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newstudent@example.com",
          password: "password123",
          name: "Duplicate Student",
        }),
      });

      assert.equal(res.status, 409);
      const data = await res.json();
      assert.match(data.error, /already in use/i);
    });

    it("rejects missing fields with 400", async () => {
      const res = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "missingname@example.com",
          password: "password123",
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, "Missing fields");
    });

    it("rejects password shorter than 8 characters", async () => {
      const res = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "shortpass@example.com",
          password: "short",
          name: "Short Pass",
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /at least 8 characters/i);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials and sets HttpOnly cookie", async () => {
      const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newstudent@example.com",
          password: "password123",
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.user);
      assert.equal(data.user.email, "newstudent@example.com");
      assert.equal(data.user.password, undefined, "password must not be in response");

      const cookie = res.headers.get("set-cookie");
      assert.ok(cookie, "set-cookie header should be present");
      assert.match(cookie, /cc_token=/);
      assert.match(cookie, /HttpOnly/i);
    });

    it("rejects invalid password with 401", async () => {
      const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newstudent@example.com",
          password: "wrongpassword",
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, "Invalid email or password");
    });

    it("rejects non-existent user with 401", async () => {
      const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, "Invalid email or password");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the session cookie", async () => {
      const res = await fetch(`${baseUrl}/logout`, {
        method: "POST",
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.message, "Logged out successfully");

      const cookie = res.headers.get("set-cookie");
      assert.ok(cookie);
      assert.match(cookie, /Expires=|Max-Age=0/i);
    });
  });

  describe("Password Reset Flow", () => {
    it("POST /api/auth/forgot-password generates reset token for valid user", async () => {
      const res = await fetch(`${baseUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newstudent@example.com" }),
      });

      assert.equal(res.status, 200);
      const user = await User.findOne({ email: "newstudent@example.com" });
      assert.ok(user.resetToken);
      assert.ok(user.resetTokenExpiry > new Date());
    });

    it("POST /api/auth/reset-password resets password with valid token", async () => {
      const user = await User.findOne({ email: "newstudent@example.com" });
      const token = user.resetToken;

      const res = await fetch(`${baseUrl}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: "newbrandpassword456",
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.message, "Password reset successful");

      // Verify old password fails and new password succeeds
      const loginOld = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newstudent@example.com", password: "password123" }),
      });
      assert.equal(loginOld.status, 401);

      const loginNew = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newstudent@example.com", password: "newbrandpassword456" }),
      });
      assert.equal(loginNew.status, 200);
    });

    it("POST /api/auth/reset-password rejects invalid token", async () => {
      const res = await fetch(`${baseUrl}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "invalid-or-already-used-token",
          password: "somepassword789",
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /invalid or expired/i);
    });
  });
});
