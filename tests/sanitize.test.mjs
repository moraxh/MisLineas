import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/sanitize.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
});
const { stripCURPs } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("masks phone numbers recursively, keeping the last 4 digits", () => {
  const out = stripCURPs({
    a: "5512346789",
    b: ["55 1234 6789", { c: "+52 55-1234-6789" }],
    d: 5512346789,
    e: "******6789",
    f: 1700000000000,
  });
  assert.equal(out.a, "XXXXXX6789");
  assert.equal(out.b[0], "XX XXXX 6789");
  assert.equal(out.b[1].c, "+XX XX-XXXX-6789");
  assert.equal(out.d, "XXXXXX6789");
  assert.equal(out.e, "******6789");
  assert.equal(out.f, 1700000000000);
});

test("still strips CURPs", () => {
  assert.equal(stripCURPs("HEGG560427MVZRRL04"), "[CURP]");
});
