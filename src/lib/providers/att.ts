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

async function attempt(
  curp: string,
  executablePath: string,
  extraArgs: string[],
): Promise<LineResult | null> {
  const t0 = Date.now();
  const proxy = getResidentialProxyUrl();
  stageLog(`proxy ${proxy ? "configured" : "not configured"}`, t0);
  const { default: puppeteer } = await import("puppeteer-core");

  const proxyArg = proxy ? [`--proxy-server=${new URL(proxy).origin}`] : [];
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--window-size=1280,800",
    "--disable-blink-features=AutomationControlled",
    `--user-agent=${UA}`,
    ...extraArgs,
    ...proxyArg,
  ];

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args,
  });
  stageLog("browser launched", t0);

  try {
    const page = await browser.newPage();
    stageLog("page opened", t0);

    if (proxy) {
      const proxyUrl = new URL(proxy);
      await page.authenticate({
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password),
      });
      stageLog("proxy authenticated", t0);
    }

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

      if (!sessionRes.ok) return { error: `initlines ${sessionRes.status}` };

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
  }
}

const MAX_ATTEMPTS = 3;

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
