export const runtime = "nodejs";
export const maxDuration = 120;

import type { NextRequest } from "next/server";
import {
  lookupCURPINMobig,
  lookupCURPINYoMobile,
  lookupCURPInABIB,
  lookupCURPInAltanMVNO,
  lookupCURPInBeneleit,
  lookupCURPInDialo,
  lookupCURPInIENTC,
  lookupCURPInLogisticaACN,
  lookupCURPInMirlo,
  lookupCURPInTelcel,
  lookupCURPInFreedompop,
  loookupCURPINWeeex,
  loookupCURPInVirginMobile,
  loookupCURPInTalentoNetMVNO,
} from "@/lib/providers";
import { validateCURP } from "@/lib/providers/curp";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { stripCURPs } from "@/lib/sanitize";
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
  // {
  //   provider: "AT&T",
  //   lookupFunction: lookupCURPInATT,
  //   // Disabled: ~170-800KB per lookup (full browser + Shape's common.js on
  //   // every call) — ~95% of MisLineas's residential-proxy bandwidth. All other
  //   // providers cost ~7-8KB. Not worth the proxy budget vs the rest.
  // },
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
  // {
  //   provider: "Sorcel",
  //   lookupFunction: lookupCURPInSorcel,
  //   // Disabled: Cloudflare JS challenge blocks server-side requests
  // },
  {
    provider: "TalentoNet (Newww, Red Aguila, Link Móvil)",
    lookupFunction: loookupCURPInTalentoNetMVNO,
  },
  {
    provider: "Virgin Mobile",
    lookupFunction: loookupCURPInVirginMobile,
  },
  // {
  //   provider: "Weex",
  //   lookupFunction: loookupCURPINWeeex,
  // },
  {
    provider: "Freedompop",
    lookupFunction: lookupCURPInFreedompop,
  },
  // {
  //   provider: "Yo Mobile",
  //   lookupFunction: lookupCURPINYoMobile,
  // },
];

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...cors, "Retry-After": "60" },
    });
  }

  const { curp } = await req.json();

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

  // Use a streaming response to return results as soon as they resolve
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const lookupWithRetry = async (p: (typeof providers)[number]) => {
        for (let attempt = 0; ; attempt += 1) {
          try {
            const result = await p.lookupFunction(curp);
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
