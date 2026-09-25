import http from "node:http";
import net from "node:net";
import type { Server as ProxyChainServer } from "proxy-chain";
import { getResidentialProxyUrl } from "@/lib/proxy";
import type { LineResult } from "@/types";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

// Stage timing: logged (without token/CURP/proxy credentials) so a timeout
// in production shows which stage actually stalled — browser launch, proxy
// handshake, page.goto, or the Shape cookie wait — instead of just "AT&T
// attempt N threw: ERR_TIMED_OUT" with no indication of where the time went.
function stageLog(label: string, t0: number) {
  console.log(`[att] ${label} (+${Date.now() - t0}ms)`);
}

// Chromium dialing the residential gateway itself stalled on Vercel until its
// own ~30s connect timeout (net::ERR_TIMED_OUT), while every Node-based
// provider going through the same gateway worked. Chromium doesn't fail over
// between the gateway's A records the way Node does, so it now talks to a
// local, unauthenticated proxy-chain relay and Node dials the gateway:
// Happy Eyeballs across every resolved address, a hard deadline on both the
// TCP connect and the CONNECT reply, and per-connection timing in the logs.
const GATEWAY_ATTEMPT_TIMEOUT_MS = 2000;
const GATEWAY_CONNECT_TIMEOUT_MS = 10000;
// Production logs show the gateway routinely accepts the TCP connection but
// never answers the CONNECT (0 bytes read, stuck until this fires) — 11/11
// attempts across 4 separate lookups. 15s was needlessly generous for that
// case and, combined with Chromium opening a second connection after the
// first dies, doubled the cost of every stuck attempt (~30s total per try).
const GATEWAY_REPLY_TIMEOUT_MS = 6000;

class GatewayAgent extends http.Agent {
  private readonly t0: number;

  constructor(t0: number) {
    super({ keepAlive: false });
    this.t0 = t0;
  }

  createConnection(options: http.ClientRequestArgs) {
    const started = Date.now();
    const target = `${options.host}:${options.port}`;
    const socket = net.connect({
      host: options.host ?? undefined,
      port: Number(options.port),
      autoSelectFamily: true,
      autoSelectFamilyAttemptTimeout: GATEWAY_ATTEMPT_TIMEOUT_MS,
    });

    const connectTimer = setTimeout(() => {
      socket.destroy(
        new Error(
          `gateway TCP connect to ${target} timed out after ${GATEWAY_CONNECT_TIMEOUT_MS}ms`,
        ),
      );
    }, GATEWAY_CONNECT_TIMEOUT_MS);

    socket.once("connect", () => {
      clearTimeout(connectTimer);
      stageLog(
        `gateway TCP connected to ${socket.remoteAddress} in ${Date.now() - started}ms`,
        this.t0,
      );
      // The gateway accepting TCP but never answering the CONNECT is the
      // other way this can hang, so bound the wait for its first byte too.
      socket.setTimeout(GATEWAY_REPLY_TIMEOUT_MS);
    });
    socket.on("timeout", () => {
      if (socket.bytesRead === 0) {
        socket.destroy(
          new Error(
            `gateway ${socket.remoteAddress} sent no CONNECT reply within ${GATEWAY_REPLY_TIMEOUT_MS}ms`,
          ),
        );
      } else {
        socket.setTimeout(0);
      }
    });
    socket.once("error", (err) => {
      clearTimeout(connectTimer);
      stageLog(
        `gateway connection failed after ${Date.now() - started}ms: ${err.message}`,
        this.t0,
      );
    });

    return socket;
  }
}

async function startGatewayRelay(
  upstreamProxyUrl: string,
  t0: number,
): Promise<ProxyChainServer> {
  const { Server } = await import("proxy-chain");
  const httpAgent = new GatewayAgent(t0);
  const relay = new Server({
    host: "127.0.0.1",
    port: 0,
    // proxy-chain swallows upstream-connection errors internally (chain.js
    // handles client.on('error', ...) itself and never emits 'requestFailed'
    // for them) — its own console.log via `verbose` is the only way to see
    // them, which is how we caught the gateway silently sitting on an open
    // TCP connection without ever answering the CONNECT.
    verbose: true,
    prepareRequestFunction: () => ({ upstreamProxyUrl, httpAgent }),
  });
  relay.on("requestFailed", ({ error }: { error: Error }) => {
    stageLog(`relay request failed: ${error.message}`, t0);
  });
  await relay.listen();
  return relay;
}

async function attempt(
  curp: string,
  executablePath: string,
  extraArgs: string[],
): Promise<LineResult | null> {
  const t0 = Date.now();
  const proxy = getResidentialProxyUrl();
  stageLog(`proxy ${proxy ? "configured" : "not configured"}`, t0);
  const { default: puppeteer } = await import("puppeteer-core");

  const relay = proxy ? await startGatewayRelay(proxy, t0) : null;
  if (relay) stageLog(`gateway relay listening on :${relay.port}`, t0);

  const proxyArg = relay
    ? [`--proxy-server=http://127.0.0.1:${relay.port}`]
    : [];
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--window-size=1280,800",
    "--disable-blink-features=AutomationControlled",
    `--user-agent=${UA}`,
    ...extraArgs,
    ...proxyArg,
  ];

  const browser = await puppeteer
    .launch({
      executablePath,
      headless: true,
      args,
    })
    .catch(async (err) => {
      await relay?.close(true);
      throw err;
    });
  stageLog("browser launched", t0);

  try {
    const page = await browser.newPage();
    stageLog("page opened", t0);

    await page.setBypassCSP(true);

    await page.evaluateOnNewDocument(() => {
      delete Object.getPrototypeOf(navigator).webdriver;
      Object.defineProperty(window, "chrome", {
        writable: true,
        enumerable: true,
        configurable: false,
        value: { runtime: {} },
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-MX", "es", "en-US", "en"],
      });
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const blockedType = [
        "image",
        "stylesheet",
        "font",
        "media",
        "other",
      ].includes(req.resourceType());
      // Only common.js (Shape's bot-detection script) is needed to generate the
      // OClmoOot cookie — the SPA bundle (index-*.js + LandingPage-*.js, ~776KB)
      // is dead weight since we never render the page, just call the two fetch endpoints
      const uiScript =
        req.resourceType() === "script" && !req.url().includes("/common.js");

      if (blockedType || uiScript) {
        req.abort();
      } else {
        req.continue();
      }
    });

    stageLog("navigating to att.com.mx...", t0);
    await page.goto("https://att.com.mx/controlpersonal/", {
      waitUntil: "domcontentloaded",
      timeout: 50000,
    });
    stageLog("page.goto resolved", t0);

    await page.waitForFunction(() => document.cookie.includes("OClmoOot"), {
      timeout: 15000,
    });
    stageLog("Shape cookie present", t0);

    // Give Shape's JS challenge time to finalize the cookie value
    await new Promise((r) => setTimeout(r, 2000));

    const result = await page.evaluate(async (curp: string) => {
      const uuid = crypto.randomUUID();
      const h = {
        accept: "application/json, text/plain, */*",
        "accept-language": "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        origin: "https://att.com.mx",
        referer: "https://att.com.mx/controlpersonal/",
      };

      // The SPA calls portalAvailability on mount and shows a maintenance
      // screen when it reports "disabled"; initlines then fails with an
      // opaque 400 ("Lambda function error: Unhandled"), so check it first.
      const availabilityRes = await fetch(
        "/controlpersonal/api/portalavailability",
        {
          method: "POST",
          headers: h,
          credentials: "include",
          body: JSON.stringify({
            operation: "portalAvailability",
            request: { portal: "consulta" },
          }),
        },
      );
      if (!availabilityRes.ok) {
        const body = await availabilityRes.text().catch(() => "");
        return {
          error: `portalavailability ${availabilityRes.status}: ${body.slice(0, 200)}`,
        };
      }
      const availability = (await availabilityRes.json()) as {
        data?: { status?: string; message?: string };
      };
      if (availability.data?.status === "disabled") {
        return {
          maintenance: availability.data.message ?? "portal disabled",
        };
      }

      const sessionRes = await fetch("/controlpersonal/api/session/initlines", {
        method: "POST",
        headers: h,
        credentials: "include",
        body: JSON.stringify({
          operation: "sessionInitLines",
          request: {
            uuid,
            timestamp: new Date().toISOString(),
            msisdn: null,
          },
        }),
      });

      if (!sessionRes.ok) {
        const body = await sessionRes.text().catch(() => "");
        return {
          error: `initlines ${sessionRes.status}: ${body.slice(0, 200)}`,
        };
      }

      const sessionData = (await sessionRes.json()) as { status: string };
      if (sessionData.status !== "SUCCESS") {
        return { error: `initlines status: ${sessionData.status}` };
      }

      // Small pause between requests to avoid Shape rate-limiting the session
      await new Promise((r) => setTimeout(r, 500));

      const validationRes = await fetch(
        "/controlpersonal/api/validatecustomer",
        {
          method: "POST",
          headers: h,
          credentials: "include",
          body: JSON.stringify({
            operation: "validateCustomer",
            request: {
              uuid,
              timestamp: new Date().toISOString(),
              idDoc: "DOC01",
              identificationId: curp,
              sourceSystem: "SS01",
            },
          }),
        },
      );

      if (!validationRes.ok) {
        const body = await validationRes.text().catch(() => "");
        return {
          error: `validatecustomer ${validationRes.status}: ${body.slice(0, 200)}`,
        };
      }

      return { data: await validationRes.json() };
    }, curp);
    stageLog("session+validation calls resolved", t0);

    if ("maintenance" in result) {
      // Not retryable: every attempt would just burn proxy bandwidth.
      // temporaryUnavailable (not error) so the frontend shows AT&T as
      // "Temporalmente no disponible" instead of a generic query error.
      console.warn("AT&T: portal under maintenance:", result.maintenance);
      return {
        company: "AT&T",
        lines: [],
        temporaryUnavailable: true,
      };
    }

    if ("error" in result) {
      console.error("AT&T:", result.error);
      return null;
    }

    const validationData = result.data as {
      status: string;
      data: {
        resultCode: string;
        countLines: number;
        customerInfo?: { associatedLines?: { phoneNumber?: string }[] };
      };
    };

    const isSuccess =
      validationData.status === "COMPLETED" ||
      validationData.status === "SUCCESS" ||
      validationData.data?.resultCode === "00";

    if (!isSuccess) {
      console.error("AT&T: non-success:", JSON.stringify(validationData));
      return null;
    }

    const data = validationData.data;

    if (data.countLines > 0) {
      const lines: string[] =
        data.customerInfo?.associatedLines
          ?.map((l) => l.phoneNumber)
          .filter((p): p is string => Boolean(p))
          .map((p) => `******${p.slice(-4)}`) ?? [];

      return {
        company: "AT&T",
        lines,
        isRegistered: true,
        rawApiResponse: validationData,
      };
    }

    return { company: "AT&T", lines: [], isRegistered: false };
  } finally {
    await browser.close();
    await relay?.close(true);
  }
}

// A stuck gateway attempt now costs ~12s worst case (two 6s CONNECT-reply
// timeouts, see GATEWAY_REPLY_TIMEOUT_MS above) instead of the previous
// ~30s, so more attempts fit inside maxDuration=300 for the same budget
// while giving the rotating gateway more chances to land on a working node.
const MAX_ATTEMPTS = 5;

export async function lookupCURPInATT(curp: string): Promise<LineResult> {
  // Resolve the executable once — downloading it on every attempt causes ETXTBSY
  // when concurrent writes race against spawns of the same binary.
  let executablePath: string;
  let extraArgs: string[];

  if (process.env.CHROME_PATH) {
    executablePath = process.env.CHROME_PATH;
    extraArgs = [];
  } else {
    // The full package (not -min) bundles the Chromium binary in the
    // function itself instead of fetching it from GitHub Releases on every
    // cold start (~13s measured locally) — worth the extra ~65MB in the
    // deploy bundle, comfortably under Vercel's 250MB function limit.
    const { default: chromium } = await import("@sparticuz/chromium");
    executablePath = await chromium.executablePath();
    extraArgs = chromium.args;
  }

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const attemptStart = Date.now();
    const result = await attempt(curp, executablePath, extraArgs).catch(
      (err) => {
        console.warn(
          `AT&T attempt ${i + 1} threw after ${Date.now() - attemptStart}ms:`,
          err,
        );
        return null;
      },
    );
    if (result !== null) return result;
    console.warn(`AT&T attempt ${i + 1} failed, retrying...`);
  }

  return {
    company: "AT&T",
    lines: [],
    error: "Failed to validate customer with AT&T",
  };
}
