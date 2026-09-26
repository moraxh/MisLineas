export const runtime = "nodejs";
// Vercel Hobby plan caps Node.js functions at 60s; raise this only if the
// project moves to Pro (up to 300s), which would also give AT&T's Puppeteer
// path more headroom to retry before the request itself times out.
// Vercel Pro allows up to 300s for Node.js functions. AT&T's Puppeteer path
// alone can reach ~65s per attempt (50s page.goto + 15s cookie wait) before
// even counting cold-start or proxy latency, and it retries up to 3 times —
// on the Hobby plan's 60s cap a single slow attempt kills the whole request
// (every other provider included), which is exactly what happened in
// production before this was raised.
export const maxDuration = 300;

import type { NextRequest } from "next/server";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { isLocalLookup } from "@/lib/local-access";
import {
  lookupCURPINMobig,
  lookupCURPInABIB,
  lookupCURPInAltanMVNO,
  lookupCURPInBeneleit,
  lookupCURPInDialo,
  lookupCURPInFreedompop,
  lookupCURPInIENTC,
  lookupCURPInLogisticaACN,
  lookupCURPInMirlo,
  lookupCURPInSorcel,
  lookupCURPInTelcel,
  loookupCURPINWeeex,
  loookupCURPInTalentoNetMVNO,
  loookupCURPInVirginMobile,
} from "@/lib/providers";
import { lookupCURPInATT } from "@/lib/providers/att";
import { validateCURP } from "@/lib/providers/curp";
import { checkRateLimit } from "@/lib/rate-limit";
import { stripCURPs } from "@/lib/sanitize";
import { verifyTurnstile } from "@/lib/turnstile";
import type { LineResult } from "@/types";

// Firing every provider at once means a dozen simultaneous name resolutions —
// each host needs both an A and an AAAA record. Under that burst a resolver can
// start answering ENOTFOUND / EAI_AGAIN for hosts that are perfectly reachable:
// a "not right now" indistinguishable from "no such host". Capping how many
// lookups are in flight keeps it out of that state. Raise it if your resolver
// copes fine — the results still stream in as each provider settles.
const LOOKUP_CONCURRENCY = 5;

// Retry only failures a warm cache fixes. Deliberately NOT timeouts: a request
// that already spent its full budget is saturation or a dead socket, never a
// name-resolution hiccup, and retrying it twice turns one slow lookup into a
// multi-minute one.
const TRANSIENT_ERROR = /fetch failed|ENOTFOUND|EAI_AGAIN/i;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const providers: Array<{
  provider: string;
  lookupFunction: (curp: string) => Promise<LineResult | LineResult[]>;
}> = [
  {
    provider: "AT&T",
    lookupFunction: lookupCURPInATT,
    // Re-enabled: Velar Technologies' sponsorship now covers the
    // residential-proxy bandwidth this provider needs (~170-800KB per lookup,
    // full browser + Shape's common.js on every call, vs ~7-8KB for the rest).
  },
  {
    provider: "Telcel",
    lookupFunction: lookupCURPInTelcel,
  },
  {
    provider: "Altan MVNO",
    lookupFunction: lookupCURPInAltanMVNO,
  },
  {
    provider: "ABIB",
    lookupFunction: lookupCURPInABIB,
  },
  {
    provider: "Beneleit Móvil",
    lookupFunction: lookupCURPInBeneleit,
  },
  {
    provider: "Dialo",
    lookupFunction: lookupCURPInDialo,
  },
  {
    provider: "IENTC",
    lookupFunction: lookupCURPInIENTC,
  },
  {
    provider: "Logistica ACN (FedeGo!, Flash Mobile, Dua)",
    lookupFunction: lookupCURPInLogisticaACN,
  },
  // {
  //   provider: "Mega Móvil",
  //   lookupFunction: lookupCURPInMegamovil,
  //   // Disabled: their API only confirms a specific CURP+phone-number
  //   // combination, there's no endpoint to list lines linked to a CURP.
  // },
  {
    provider: "Mirlo",
    lookupFunction: lookupCURPInMirlo,
  },
  {
    provider: "MoBig",
    lookupFunction: lookupCURPINMobig,
  },
  // {
  //   provider: "Nextor Movil",
  //   lookupFunction: lookupCURPINNextorMovil,
  //   // Disabled: rate limit
  // },
  {
    provider: "Sorcel",
    lookupFunction: lookupCURPInSorcel,
  },
  {
    provider: "TalentoNet (Newww, Red Aguila, Link Móvil)",
    lookupFunction: loookupCURPInTalentoNetMVNO,
  },
  {
    provider: "Virgin Mobile",
    lookupFunction: loookupCURPInVirginMobile,
  },
  {
    provider: "Weex",
    lookupFunction: loookupCURPINWeeex,
  },
  {
    provider: "Freedompop",
    lookupFunction: lookupCURPInFreedompop,
  },
  // {
  //   provider: "Yo Mobile",
  //   lookupFunction: lookupCURPINYoMobile,
  //   // Disabled: Cloudflare's managed challenge on play.prod.yomobile.xyz
  //   // started returning 403 for every request regardless of origin — same
  //   // result from a residential proxy, from this server directly, and from
  //   // an unrelated home network with no proxy at all, so it isn't IP-based.
  //   // Re-enable once it's confirmed passing again.
  // },
];

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, remaining } = await checkRateLimit(ip);

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...cors, "Retry-After": "60" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: cors },
    );
  }
  if (!body || typeof body !== "object" || !("curp" in body)) {
    return Response.json(
      { error: "CURP is required" },
      { status: 400, headers: cors },
    );
  }
  const { curp } = body;

  if (!curp || typeof curp !== "string") {
    return new Response(
      JSON.stringify({ error: "CURP is required and must be a string" }),
      { status: 400, headers: cors },
    );
  }

  const isValidCURP = validateCURP(curp);

  if (!isValidCURP) {
    return new Response(JSON.stringify({ error: "Invalid CURP format" }), {
      status: 400,
      headers: cors,
    });
  }

  const local = isLocalLookup(req);
  const verification = local
    ? { success: true as const }
    : await verifyTurnstile(
        "turnstileToken" in body ? body.turnstileToken : undefined,
      );
  if (!verification.success) {
    return Response.json(
      { error: verification.error },
      { status: verification.status, headers: cors },
    );
  }

  // Use a streaming response to return results as soon as they resolve
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // PROVIDER_TIMEOUT_MS is documented as a hard ceiling in content.ts
      // but was never actually enforced here — a provider whose own retry
      // loop runs long (AT&T: up to 5 attempts against a WAF that can take
      // ~8s per attempt to reject, 40s+ worst case) had nothing stopping it
      // short of the client's whole-request watchdog (QUERY_TIMEOUT_MS * 2,
      // 30s), which aborts the entire stream — every provider's results,
      // not just the slow one — turning "AT&T is blocked" into "the whole
      // tool looks broken". Race each provider against the ceiling so a
      // slow one reports as its own failed card instead.
      // Note: this races the timeout against the provider call, it doesn't
      // cancel it — a provider that blows past PROVIDER_TIMEOUT_MS (e.g.
      // AT&T mid-retry) keeps running in the background using proxy
      // bandwidth until it settles on its own. Actually cancelling it would
      // mean threading an AbortSignal into every provider's fetch/Puppeteer
      // calls; out of scope here, which only fixes the user-facing hang.
      const withProviderTimeout = <T>(promise: Promise<T>): Promise<T> =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("provider timeout")),
            PROVIDER_TIMEOUT_MS,
          );
          promise.then(
            (v) => {
              clearTimeout(timer);
              resolve(v);
            },
            (e) => {
              clearTimeout(timer);
              reject(e);
            },
          );
        });

      const lookupWithRetry = async (p: (typeof providers)[number]) => {
        for (let attempt = 0; ; attempt += 1) {
          try {
            const result = await withProviderTimeout(p.lookupFunction(curp));
            const results = Array.isArray(result) ? result : [result];

            // A transient network failure usually comes back as a populated
            // `error` field rather than a throw, so it has to be caught here too.
            const transient = results.some(
              (r) => r?.error && TRANSIENT_ERROR.test(r.error),
            );
            if (transient && attempt < MAX_RETRIES) {
              await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
              continue;
            }

            return results.map((r) => ({ provider: p.provider, result: r }));
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";

            if (message === "provider timeout") {
              // Not retryable: the provider already burned its own retry
              // budget getting here, so trying again would just repeat the
              // same wait. Surfaced as temporaryUnavailable (not error) so
              // the frontend shows a "No disponible" card instead of a
              // generic query error for this one provider.
              console.warn(`Lookup timed out for ${p.provider}`);
              return [
                {
                  provider: p.provider,
                  result: {
                    company: p.provider,
                    lines: [],
                    temporaryUnavailable: true,
                  },
                },
              ];
            }

            if (TRANSIENT_ERROR.test(message) && attempt < MAX_RETRIES) {
              await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
              continue;
            }

            console.error(`Lookup failed for ${p.provider}:`, error);
            return [
              {
                provider: p.provider,
                result: {
                  company: p.provider,
                  lines: [],
                  error: `Lookup failed: ${message}`,
                },
              },
            ];
          }
        }
      };

      const queue = [...providers];
      const worker = async () => {
        for (;;) {
          const p = queue.shift();
          if (!p) return;

          for (const response of await lookupWithRetry(p)) {
            controller.enqueue(
              encoder.encode(`${JSON.stringify(stripCURPs(response))}\n`),
            );
          }
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(LOOKUP_CONCURRENCY, providers.length) },
          worker,
        ),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-RateLimit-Remaining": String(remaining),
    },
  });
}
