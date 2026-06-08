/**
 * Dhru Fusion compatible endpoint
 * URL to set in Dhru Fusion: https://your-domain.vercel.app/api/dhru
 *
 * Env vars required:
 *   DHRU_API_KEY   - the API Key you set in Dhru Fusion
 *   DHRU_USERNAME  - the Username you set in Dhru Fusion
 */

import type { NextRequest } from "next/server";
import {
    lookupCURPINMobig,
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
    loookupCURPInVirginMobile,
} from "@/lib/providers";
import { validateCURP } from "@/lib/providers/curp";
import { stripCURPs } from "@/lib/sanitize";

// In-memory order store (resets on cold start, sufficient for Dhru polling)
const orders = new Map<
    string,
{
      status: "pending" | "inprogress" | "completed" | "error";
      result?: string;
      createdAt: number;
}
  >();

// Cleanup orders older than 1 hour
setInterval(() => {
    const cutoff = Date.now() - 60 * 60_000;
    for (const [id, order] of orders) {
          if (order.createdAt < cutoff) orders.delete(id);
    }
}, 10 * 60_000).unref();

function validateAuth(apiKey: string | null, username: string | null): boolean {
    const validKey = process.env.DHRU_API_KEY ?? "";
    const validUser = process.env.DHRU_USERNAME ?? "";
    if (!validKey || !validUser) return false;
    return apiKey === validKey && username === validUser;
}

async function runLookup(curp: string): Promise<string> {
    const providers = [
      { provider: "AT&T", fn: lookupCURPInATT },
      { provider: "Telcel", fn: lookupCURPInTelcel },
      { provider: "Altan MVNO", fn: lookupCURPInAltanMVNO },
      { provider: "ABIB", fn: lookupCURPInABIB },
      { provider: "Beneleit Móvil", fn: lookupCURPInBeneleit },
      { provider: "Dialo", fn: lookupCURPInDialo },
      { provider: "IENTC", fn: lookupCURPInIENTC },
      { provider: "Logistica ACN (FedeGo!, Flash Mobile, Dua)", fn: lookupCURPInLogisticaACN },
      { provider: "Mirlo", fn: lookupCURPInMirlo },
      { provider: "MoBig", fn: lookupCURPINMobig },
      { provider: "Virgin Mobile", fn: loookupCURPInVirginMobile },
      { provider: "Vinculatulinea (Freedompop/OUI/OXXO CEL/Uber Cel/AhorroCel/Chedraui Móvil/Yobi Telecom)", fn: lookupCURPInVinculatulinea },
        ];

  const results = await Promise.allSettled(
        providers.map((p) =>
                p.fn(curp).then(
                          (r) => ({ provider: p.provider, lines: r.lines ?? [], error: r.error }),
                          (e) => ({ provider: p.provider, lines: [], error: String(e?.message ?? e) }),
                        ),
                          ),
      );

  const lines: string[] = [];
    const errors: string[] = [];

  for (const r of results) {
        if (r.status === "fulfilled") {
                const val = stripCURPs(r.value) as { provider: string; lines: string[]; error?: string };
                if (val.lines && val.lines.length > 0) {
                          for (const line of val.lines) {
                                      lines.push(`${val.provider}: ${line}`);
                          }
                }
                if (val.error) {
                          errors.push(`${val.provider}: ${val.error}`);
                }
        }
  }

  if (lines.length === 0) {
        return `CURP: ${curp}\nNo se encontraron líneas registradas.\n\nErrores/No disponibles:\n${errors.slice(0, 5).join("\n")}`;
  }

  return `CURP: ${curp}\n\nLíneas encontradas:\n${lines.join("\n")}`;
}

async function handlePost(req: NextRequest): Promise<Response> {
    let body: Record<string, string> = {};

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
        body = await req.json().catch(() => ({}));
  } else {
        // application/x-www-form-urlencoded (default for Dhru Fusion)
      const text = await req.text().catch(() => "");
        for (const pair of text.split("&")) {
                const [k, v] = pair.split("=");
                if (k) body[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
        }
  }

  const apiKey = body.api_key ?? null;
    const username = body.username ?? null;
    const action = body.action ?? "";

  if (!validateAuth(apiKey, username)) {
        return Response.json({ error: "Invalid API Key or Username" }, { status: 401 });
  }

  // ── ACTION: getservices ──────────────────────────────────────────────────
  if (action === "getservices") {
        return Response.json([
          {
                    service: "1",
                    name: "Consultar Líneas Registradas (CURP México)",
                    type: "Custom",
                    rate: "0",
                    min: "1",
                    max: "1",
                    dripfeed: false,
                    refill: false,
                    cancel: false,
                    category: "Mexico CURP Lookup",
          },
              ]);
  }

  // ── ACTION: order ────────────────────────────────────────────────────────
  if (action === "order") {
        const curp = (body.link ?? body.curp ?? "").trim().toUpperCase();

      if (!curp) {
              return Response.json({ error: "CURP is required in the 'link' field" }, { status: 400 });
      }

      if (!validateCURP(curp)) {
              return Response.json({ error: "Invalid CURP format" }, { status: 400 });
      }

      const orderId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        orders.set(orderId, { status: "pending", createdAt: Date.now() });

      // Run lookup in background
      runLookup(curp)
          .then((result) => {
                    orders.set(orderId, { status: "completed", result, createdAt: Date.now() });
          })
          .catch((err) => {
                    orders.set(orderId, {
                                status: "error",
                                result: `Error: ${err?.message ?? err}`,
                                createdAt: Date.now(),
                    });
          });

      // Mark as in progress immediately
      orders.set(orderId, { status: "inprogress", createdAt: Date.now() });

      return Response.json({ order: orderId });
  }

  // ── ACTION: status ───────────────────────────────────────────────────────
  if (action === "status") {
        const orderId = body.order ?? "";
        const order = orders.get(orderId);

      if (!order) {
              return Response.json({ error: "Order not found" }, { status: 404 });
      }

      return Response.json({
              order: orderId,
              status: order.status === "completed"
                ? "Completed"
                        : order.status === "error"
                  ? "Canceled"
                          : "In progress",
              charge: "0",
              start_count: "0",
              remains: "0",
              currency: "USD",
              ...(order.result ? { note: order.result } : {}),
      });
  }

  // ── ACTION: balance ──────────────────────────────────────────────────────
  if (action === "balance") {
        return Response.json({ balance: "999999", currency: "USD" });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
    return handlePost(req);
}

// Dhru Fusion sometimes uses GET for status checks
export async function GET(req: NextRequest) {
    return handlePost(req);
}
