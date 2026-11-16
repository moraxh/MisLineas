import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { getResidentialProxyUrl } from "@/lib/proxy";
import type { LineResult } from "@/types";

const execFileAsync = promisify(execFile);

// Sorcel's Cloudflare WAF fingerprints the TLS ClientHello and blocks Node's
// fetch/undici outright (403, even with browser-like headers) while plain
// curl passes. curl-impersonate replicates Chrome's TLS fingerprint, which is
// enough to get through — invoked via execFile (argv array, no shell) so the
// CURP never touches a shell string.
function resolveBinary(): string {
  const arch = process.arch === "arm64" ? "aarch64" : "x86";
  const platform = process.platform === "darwin" ? "darwin" : "linux";
  return path.join(
    process.cwd(),
    "node_modules",
    "node-curl-impersonate",
    "bin",
    `curl-impersonate-chrome-${platform}-${arch}`,
  );
}

const MAX_ATTEMPTS = 3;
const CLOUDFLARE_BLOCK =
  /Attention Required! \| Cloudflare|Just a moment\.\.\./;

export async function lookupCURPInSorcel(curp: string): Promise<LineResult> {
  try {
    // Cloudflare blocks some residential exit IPs ("Attention Required").
    // Every attempt picks a new random proxy, so retrying usually lands on a
    // clean exit instead of failing the whole card.
    let stdout = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const proxyUrl = getResidentialProxyUrl();
      const proxyArgs = proxyUrl ? ["--proxy", proxyUrl] : [];

      ({ stdout } = await execFileAsync(
        resolveBinary(),
        [
          "-s",
          "-X",
          "POST",
          "-F",
          `curpa=${curp}`,
          "--compressed",
          "--max-time",
          String(Math.ceil(PROVIDER_TIMEOUT_MS / 1000)),
          ...proxyArgs,
          "https://www.soriup.mx/consultaR.asp",
        ],
        { timeout: PROVIDER_TIMEOUT_MS },
      ));

      if (!CLOUDFLARE_BLOCK.test(stdout)) break;
      console.warn(`[sorcel] Cloudflare block on attempt ${attempt}`);
    }

    if (stdout.includes("No hay registros para esa RFC/CURP")) {
      return {
        company: "Sorcel",
        lines: [],
        isRegistered: false,
      };
    }

    // Only treat the response as a hit when it's actually the results table
    // Sorcel renders for a match. Anything else — a Cloudflare challenge page,
    // a 5xx error page, an unrelated HTML blob — must NOT default to
    // isRegistered: true, since that string's absence alone isn't proof of a
    // match and was producing false positives.
    const hasResultsTable =
      /Listado de líneas/.test(stdout) && /<table class="esp"/.test(stdout);

    if (!hasResultsTable) {
      console.error(
        "[sorcel] unrecognized response (not a results table nor a 'no records' page):",
        stdout.slice(0, 500),
      );
      return {
        company: "Sorcel",
        lines: [],
        error: "Unrecognized response from Sorcel",
        rawApiResponse: {
          responseType: "html",
          snippet: stdout.slice(0, 500),
        },
      };
    }

    console.log("[sorcel] registered response (HTML text):", stdout);
    return {
      company: "Sorcel",
      lines: [],
      isRegistered: true,
      rawApiResponse: {
        responseType: "html",
        snippet: stdout.slice(0, 500),
      },
    };
  } catch (e) {
    console.error("Failed to validate CURP with Sorcel:", e);
    return {
      company: "Sorcel",
      lines: [],
      error: "Failed to validate CURP with Sorcel",
    };
  }
}
