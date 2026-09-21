import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, test } from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/turnstile.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
});
const { verifyTurnstile } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const originalFetch = globalThis.fetch;
const originalSecret = process.env.TURNSTILE_SECRET_KEY;
const originalHosts = process.env.TURNSTILE_ALLOWED_HOSTNAMES;
let calls;
beforeEach(() => {
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  process.env.TURNSTILE_ALLOWED_HOSTNAMES =
    "mislineas.com.mx, preview.example.com";
  calls = [];
  globalThis.fetch = async (...args) => {
    calls.push(args);
    return Response.json({
      success: true,
      hostname: "mislineas.com.mx",
      action: "lookup",
    });
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of [
    ["TURNSTILE_SECRET_KEY", originalSecret],
    ["TURNSTILE_ALLOWED_HOSTNAMES", originalHosts],
  ]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
test("validates through Siteverify with the secret and token only", async () => {
  assert.deepEqual(await verifyTurnstile("token"), { success: true });
  assert.equal(
    calls[0][0],
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  );
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    secret: "test-secret",
    response: "token",
  });
  assert.equal(calls[0][1].cache, "no-store");
  assert.ok(calls[0][1].signal instanceof AbortSignal);
});
test("rejects missing, malformed and oversized tokens without a network call", async () => {
  for (const token of [undefined, null, {}, 4, "", "  ", "x".repeat(2049)]) {
    assert.equal((await verifyTurnstile(token)).status, 403);
  }
  assert.equal(calls.length, 0);
});
test("fails closed when either required configuration is missing", async () => {
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.equal((await verifyTurnstile("token")).status, 503);
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  process.env.TURNSTILE_ALLOWED_HOSTNAMES = " , ";
  assert.equal((await verifyTurnstile("token")).status, 503);
  assert.equal(calls.length, 0);
});
test("rejects expired/replayed tokens, different hosts/actions and non-boolean success", async () => {
  for (const result of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, hostname: "attacker.example", action: "lookup" },
    { success: true, hostname: "mislineas.com.mx", action: "other" },
    { success: "true", hostname: "mislineas.com.mx", action: "lookup" },
    { success: true },
  ]) {
    globalThis.fetch = async () => Response.json(result);
    assert.equal((await verifyTurnstile("token")).status, 403);
  }
});
test("fails closed for outages, timeout, invalid JSON and malformed responses", async () => {
  for (const fetcher of [
    async () => {
      throw new DOMException("timeout", "TimeoutError");
    },
    async () => new Response("", { status: 503 }),
    async () => new Response("not JSON"),
    async () => Response.json(null),
  ]) {
    globalThis.fetch = fetcher;
    assert.equal((await verifyTurnstile("token")).status, 503);
  }
});
