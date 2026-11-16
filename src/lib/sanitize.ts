// CURP: 18 chars, letter+digit pattern defined by RENAPO
const CURP_RE = /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/gi;

// Mexican phone number: 10 digits, optionally prefixed by 52 / +52 and
// optionally split by spaces, dots or dashes (55 1234 6789, 55-1234-6789).
// The lookarounds keep longer digit runs (timestamps, ids) untouched.
const PHONE_RE = /(?<!\d)(?:\+?52[\s.-]?)?(?:\d[\s.-]?){9}\d(?!\d)/g;

function maskPhones(text: string): string {
  return text.replace(PHONE_RE, (match) => {
    let digitsLeft = match.replace(/\D/g, "").length;
    // Keep the last 4 digits, hide the rest, preserve separators.
    return match.replace(/\d/g, (d) => (--digitsLeft < 4 ? d : "X"));
  });
}

function sanitizeString(value: string): string {
  return maskPhones(value.replace(CURP_RE, "[CURP]"));
}

export function stripCURPs(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (typeof value === "number") {
    // Phone numbers sometimes arrive as bare JSON numbers.
    const text = String(value);
    return PHONE_RE.test(text) ? maskPhones(text) : value;
  }
  if (Array.isArray(value)) {
    return value.map(stripCURPs);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        stripCURPs(v),
      ]),
    );
  }
  return value;
}
