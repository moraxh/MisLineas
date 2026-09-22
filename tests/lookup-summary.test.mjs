import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/lookup-summary.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
);
const { summarizeLookup } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("coverage counts operator labels once, not phone lines", () => {
  assert.deepEqual(
    summarizeLookup([
      { operadora: "Marca A" },
      { operadora: "marca a" },
      { operadora: "Marca B", isNotFound: true },
      { operadora: "Grupo C", isPossible: true },
    ]),
    { answered: 3, unverified: 0 },
  );
});
test("errors and unavailable responses both count as unverified, including partial failures", () => {
  assert.deepEqual(
    summarizeLookup([
      { operadora: "Marca A" },
      { operadora: "Marca A", isError: true },
      { operadora: "Marca B", isUnavailable: true },
    ]),
    { answered: 0, unverified: 2 },
  );
  assert.deepEqual(summarizeLookup([]), { answered: 0, unverified: 0 });
});
