import type { NextRequest } from "next/server";
import {
    lookupCURPINMobig,
    lookupCURPINYoMobile,
    lookupCURPInABIB,
    lookupCURPInAltanMVNO,
    lookupCURPInATT,
    lookupCURPInBeneleit,
    lookupCURPInDialo,
    lookupCURPInIENTC,
    lookupCURPInLogisticaACN,
    lookupCURPInMirlo,
    lookupCURPInTelcel,
    lookupCURPInVinculatulinea,
    loookupCURPINWeeex,
    loookupCURPInVirginMobile,
} from "@/lib/providers";
import { validateCURP } from "@/lib/providers/curp";
import { checkRateLimit, validateApiKey } from "@/lib/rate-limit";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

const providers: Array<{
    provider: string;
    lookupFunction: (curp: string) => Promise<LineResult>;
}> = [
  {
        provider: "AT&T",
        lookupFunction: lookupCURPInATT,
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
    //   // Disabled: WAF blocks server IP (Attack ID: 20000018)
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
    // {
    //   provider: "TalentoNet (Newww, Red Aguila, Link Móvil)",
    //   lookupFunction: loookupCURPInTalentoNetMVNO,
    //   // Disabled: ConnectTimeoutError on core.newww.mx:443
    // },
  {
        provider: "Virgin Mobile",
        lookupFunction: loookupCURPInVirginMobile,
  },
    // {
    //   provider: "Weex",
    //   lookupFunction: loookupCURPINWeeex,
    // },
  {
        provider:
                "Vinculatulinea (Freedompop/OUI/OXXO CEL/Uber Cel/AhorroCel/Chedraui Móvil/Yobi Telecom)",
        lookupFunction: lookupCURPInVinculatulinea,
  },
    // {
    //   provider: "Yo Mobile",
    //   lookupFunction: lookupCURPINYoMobile,
    // },
  ];

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const isApiKeyRequest = validateApiKey(authHeader);

  // Only apply rate limiting to requests without a valid API Key
  if (!isApiKeyRequest) {
        const ip =
                req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const { allowed, remaining } = checkRateLimit(ip);

      if (!allowed) {
              return new Response(JSON.stringify({ error: "Too many requests" }), {
                        status: 429,
                        headers: { "Retry-After": "60" },
              });
      }
  }

  const { curp } = await req.json();

  if (!curp || typeof curp !== "string") {
        return new Response(
                JSON.stringify({ error: "CURP is required and must be a string" }),
          { status: 400 },
              );
  }

  const isValidCURP = validateCURP(curp);

  if (!isValidCURP) {
        return new Response(JSON.stringify({ error: "Invalid CURP format" }), {
                status: 400,
        });
  }

  // Use a streaming response to return results as soon as they resolve
  const stream = new ReadableStream({
        async start(controller) {
                const encoder = new TextEncoder();

          const promises = providers.map((p) =>
                    p
                                                   .lookupFunction(curp)
                                                   .then(
                                                                 (result) => ({ provider: p.provider, result }),
                                                                 (error) => {
                                                                                 console.error(`Lookup failed for ${p.provider}:`, error);
                                                                                 return {
                                                                                                   provider: p.provider,
                                                                                                   result: {
                                                                                                                       company: p.provider,
                                                                                                                       lines: [],
                                                                                                                       error: `Lookup failed: ${error.message}`,
                                                                                                     },
                                                                                 };
                                                                 },
                                                               )
                                                   .catch((error) => {
                                                                 console.error(
                                                                                 `Unexpected error looking up CURP in ${p.provider}:`,
                                                                                 error,
                                                                               );
                                                                 return {
                                                                                 provider: p.provider,
                                                                                 result: {
                                                                                                   company: p.provider,
                                                                                                   lines: [],
                                                                                                   error: "An unexpected error occurred during lookup",
                                                                                 },
                                                                 };
                                                   })
                                                   .then((response) => {
                                                                 const sanitized = stripCURPs(response);
                                                                 controller.enqueue(
                                                                                 encoder.encode(`${JSON.stringify(sanitized)}\n`),
                                                                               );
                                                   }),
                                               );

          await Promise.allSettled(promises);
                controller.close();
        },
  });

  return new Response(stream, {
        headers: {
                "Content-Type": "application/x-ndjson",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "X-RateLimit-Remaining": isApiKeyRequest ? "unlimited" : "see-header",
        },
  });
}
