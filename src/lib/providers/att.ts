import { getResidentialProxyUrl } from "@/lib/proxy";
import type { LineResult } from "@/types";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

async function attempt(
  curp: string,
  executablePath: string,
  extraArgs: string[],
): Promise<LineResult | null> {
  const proxy = getResidentialProxyUrl();
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

  try {
    const page = await browser.newPage();

    if (proxy) {
      const proxyUrl = new URL(proxy);
      await page.authenticate({
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password),
      });
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

    await page.goto("https://att.com.mx/controlpersonal/", {
      waitUntil: "domcontentloaded",
      timeout: 50000,
    });

    await page.waitForFunction(() => document.cookie.includes("OClmoOot"), {
      timeout: 15000,
    });

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
    const { default: chromium } = await import("@sparticuz/chromium-min");
    executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar",
    );
    extraArgs = chromium.args;
  }

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = await attempt(curp, executablePath, extraArgs).catch(
      (err) => {
        console.warn(`AT&T attempt ${i + 1} threw:`, err);
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
