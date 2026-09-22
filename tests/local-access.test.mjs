import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  readFileSync(new URL("../src/lib/local-access.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  },
);
const { isLocalLookup } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
test("local access requires development, explicit configuration, loopback and same-origin browser request", () => {
  const oldNode = process.env.NODE_ENV,
    oldFlag = process.env.LOCAL_LOOKUP_ENABLED;
  const make = (
    url = "http://127.0.0.1:3100/api/lookup",
    origin = "http://127.0.0.1:3100",
    host = "127.0.0.1:3100",
    site = "same-origin",
  ) => new Request(url, { headers: { origin, host, "sec-fetch-site": site } });
  try {
    process.env.NODE_ENV = "development";
    process.env.LOCAL_LOOKUP_ENABLED = "true";
    assert.equal(isLocalLookup(make()), true);
    assert.equal(isLocalLookup(make("http://localhost:3100/api/lookup")), true);
    assert.equal(isLocalLookup(make("http://0.0.0.0:3100/api/lookup")), true);
    for (const host of ["192.168.68.50:3100", "0.0.0.0:3100"]) {
      assert.equal(
        isLocalLookup(
          make("http://0.0.0.0:3100/api/lookup", `http://${host}`, host),
        ),
        false,
      );
    }
    assert.equal(isLocalLookup(make(undefined, "https://other.test")), false);
    assert.equal(
      isLocalLookup(make(undefined, undefined, undefined, "cross-site")),
      false,
    );
    assert.equal(
      isLocalLookup(
        make(
          "https://example.com/api/lookup",
          "https://example.com",
          "example.com",
        ),
      ),
      false,
    );
    process.env.NODE_ENV = "production";
    assert.equal(isLocalLookup(make()), false);
    process.env.NODE_ENV = "development";
    delete process.env.LOCAL_LOOKUP_ENABLED;
    assert.equal(isLocalLookup(make()), false);
  } finally {
    for (const [key, value] of [
      ["NODE_ENV", oldNode],
      ["LOCAL_LOOKUP_ENABLED", oldFlag],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("production frontend ignores the local lookup flag", () => {
  const { outputText } = ts.transpileModule(
    readFileSync(
      new URL("../src/lib/local-client.ts", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  const enabled = (mode, flag) => {
    const exports = {};
    new Function("exports", "process", outputText)(exports, {
      env: { NODE_ENV: mode, NEXT_PUBLIC_LOCAL_LOOKUP: flag },
    });
    return exports.LOCAL_LOOKUP;
  };
  assert.equal(enabled("production", "true"), false);
  assert.equal(enabled("development", "true"), true);
  assert.equal(enabled("development", undefined), false);
});
