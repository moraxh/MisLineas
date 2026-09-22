import type { DisplayLine } from "@/types";

// Count distinct labels returned by the adapters, never result rows or phone lines.
// A partial failure keeps that operator/group in the unverified category.
export function summarizeLookup(results: DisplayLine[]) {
  const operators = new Map<string, boolean>();
  for (const line of results) {
    const key = line.operadora.trim().toLocaleLowerCase("es");
    const failed = !!(line.isError || line.isUnavailable);
    operators.set(key, (operators.get(key) ?? false) || failed);
  }
  const unverified = [...operators.values()].filter(Boolean).length;
  return { answered: operators.size - unverified, unverified };
}
