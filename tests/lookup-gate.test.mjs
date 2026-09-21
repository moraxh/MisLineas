import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function loadRoute(verification) {
  let providerCalls = 0;
  let verifiedToken;
  const mocks = {
    "@/lib/cors": {
      corsHeaders: () => ({
        "Access-Control-Allow-Origin": "https://mislineas.com.mx",
      }),
      corsPreflight: () => new Response(null, { status: 204 }),
    },
    "@/lib/providers": new Proxy(
      {},
      {
        get: () => async () => {
          providerCalls++;
          return { company: "mock", lines: [] };
        },
      },
    ),
    "@/lib/providers/curp": { validateCURP: () => true },
    "@/lib/rate-limit": {
      checkRateLimit: () => ({ allowed: true, remaining: 9 }),
    },
    "@/lib/sanitize": { stripCURPs: (value) => value },
    "@/lib/turnstile": {
      verifyTurnstile: async (token) => {
        verifiedToken = token;
        return verification;
      },
    },
  };
  const { outputText } = ts.transpileModule(
    readFileSync(
      new URL("../src/app/api/lookup/route.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    },
  );
  const exports = {};
  const requireMock = (name) => {
    assert.ok(name in mocks, `Unexpected module: ${name}`);
    return mocks[name];
  };
  new Function("require", "exports", outputText)(requireMock, exports);
  return { ...exports, calls: () => providerCalls, token: () => verifiedToken };
}
function request(body) {
  return new Request("https://example.test/api/lookup", {
    method: "POST",
    body,
  });
}
test("rejected or unavailable verification never invokes providers and preserves CORS", async () => {
  for (const status of [403, 503]) {
    const route = loadRoute({
      success: false,
      status,
      error: "verification failed",
    });
    const response = await route.POST(
      request(JSON.stringify({ curp: "synthetic", turnstileToken: "token" })),
    );
    assert.equal(response.status, status);
    assert.equal(
      response.headers.get("Access-Control-Allow-Origin"),
      "https://mislineas.com.mx",
    );
    assert.equal(route.calls(), 0);
    assert.equal(route.token(), "token");
  }
});
test("malformed JSON and null bodies return 400 without querying providers", async () => {
  const route = loadRoute({ success: true });
  for (const body of ["{", "null", "{}"]) {
    assert.equal((await route.POST(request(body))).status, 400);
    assert.equal(route.calls(), 0);
  }
});
test("successful verification preserves NDJSON streaming with mocked providers", async () => {
  const route = loadRoute({ success: true });
  const response = await route.POST(
    request(JSON.stringify({ curp: "synthetic", turnstileToken: "token" })),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/x-ndjson");
  const lines = (await response.text()).trim().split("\n");
  assert.ok(lines.length > 0);
  assert.equal(lines.length, route.calls());
  for (const line of lines) assert.ok(JSON.parse(line).provider);
});
