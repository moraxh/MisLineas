import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import crypto from "node:crypto";
import type { LineResult } from "@/types";
import { solveCapChallenge } from "./solver";

export const ALTAN_MVNO_PROVIDERS = [
  "2y2x",
  "Abafon",
  "Abix",
  "Addinteli",
  "AI Telecomm",
  "ALLCE (Appcel)",
  "BienCel",
  "Bigcel",
  "Bromovil",
  "CFE",
  "Chip Macropay",
  "CoolMobile",
  "Comunicaciones Green",
  "Conect2",
  "Diri Móvil",
  "ENI Networks",
  "Fangio Mobile",
  "Fibracell",
  "FRC Mobile",
  "Gamers",
  "Gane",
  "Glovo Telecom",
  "Gmovil",
  "Grupo Inten",
  "Hashtag",
  "I AM Abundance",
  "Interlinked",
  "Inxel",
  "Iusatel",
  "Kolors Mobile",
  "Maifon",
  "México Móvil",
  "Mexfon",
  "MobileArionet",
  "Movired",
  "Móvil para Todos",
  "Nabi",
  "Netmas",
  "On-Link",
  "Othisi Mobile",
  "PilloFon",
  "Playcell",
  "Red Blak",
  "Red Dog",
  "Redicoppel",
  "Retemex",
  "RETESEC",
  "Rincel",
  "Secure Witness",
  "Sfon",
  "Sky",
  "Spot 1",
  "Starline",
  "Telefónica Luna",
  "Telgen",
  "Telmovil",
  "Teracel",
  "TIC-OMV",
  "Tuis",
  "TurboCel",
  "Ultracel",
  "Vasanta",
  "VivaMX",
  "Wiki Katat",
  "Wimotelecom",
];

export async function lookupCURPInAltanMVNO(curp: string): Promise<LineResult> {
  const challengeResponse = await fetch(
    "https://rnu.altanredes.com/api/mx/captcha/a92a56476f/challenge",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      referrer: "https://rnu.altanredes.com/consulta",
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.6",
        priority: "u=1, i",
        "sec-ch-ua": '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        Referer: "https://rnu.altanredes.com/consulta",
      },
    },
  );

  if (!challengeResponse.ok) {
    return {
      company: "Red Altan (MVNOs)",
      lines: [],
      error: "Failed to get CAPTCHA challenge",
    };
  }

  const challengeData = await challengeResponse.json();
  const solution = await solveCapChallenge(challengeData);

  const redeemResponse = await fetch(
    "https://rnu.altanredes.com/api/mx/captcha/a92a56476f/redeem",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.6",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua": '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
      },
      body: JSON.stringify(solution),
      referrer: "https://rnu.altanredes.com/consulta",
    },
  );

  if (!redeemResponse.ok) {
    return {
      company: "Red Altan (MVNOs)",
      lines: [],
      error: "Failed to redeem CAPTCHA",
    };
  }

  const redeemData = await redeemResponse.json();

  if (!redeemData.success) {
    return {
      company: "Red Altan (MVNOs)",
      lines: [],
      error: "CAPTCHA not solved correctly",
    };
  }

  const sessionID = crypto.randomUUID();

  const validationParams = {
    t: {
      t: 10,
      i: 0,
      p: {
        k: ["data"],
        v: [
          {
            t: 10,
            i: 1,
            p: {
              k: [
                "personType",
                "citizenship",
                "curp",
                "passportNumber",
                "page",
                "captchaToken",
                "clientSessionId",
              ],
              v: [
                { t: 1, s: "physical" },
                { t: 1, s: "mexican" },
                { t: 1, s: curp },
                { t: 2, s: 1 },
                { t: 0, s: 1 },
                { t: 1, s: redeemData.token },
                { t: 1, s: sessionID },
              ],
            },
            o: 0,
          },
        ],
      },
      o: 0,
    },
    f: 63,
    m: [],
  };

  const url = `https://rnu.altanredes.com/_serverFn/be0aebbc40b7f89dcde6ed49a1fdaffb199dd02f87e1de771662e51d6e55c421?payload=${encodeURIComponent(JSON.stringify(validationParams))}`;

  const validationResponse = await fetch(url, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      accept:
        "application/x-tss-framed, application/x-ndjson, application/json",
      "accept-language": "en-US,en;q=0.6",
      priority: "u=1, i",
      "sec-ch-ua": '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "x-tsr-serverfn": "true",
      Referer: "https://rnu.altanredes.com/consulta",
    },
    body: null,
  });

  if (!validationResponse.ok) {
    return {
      company: "Red Altan (MVNOs)",
      possibleProviders: ALTAN_MVNO_PROVIDERS,
      lines: [],
      error: "Failed to validate CURP",
    };
  }

  const validationData = await validationResponse.json();

  const resultObj = validationData?.p?.v?.[0];
  const keys: string[] = resultObj?.p?.k ?? [];
  const vals: {
    t: number;
    s: unknown;
    a?: unknown[];
    p?: { k: string[]; v: { t: number; s: unknown; a?: unknown[] }[] };
  }[] = resultObj?.p?.v ?? [];

  const groupsRaw = (vals[keys.indexOf("groups")]?.a ?? []) as {
    p: {
      k: string[];
      v: {
        t: number;
        s: unknown;
        a?: { p: { k: string[]; v: { t: number; s: unknown }[] } }[];
      }[];
    };
  }[];

  const lines: string[] = [];

  for (const group of groupsRaw) {
    const gk = group.p.k;
    const gv = group.p.v;
    const omvName = gv[gk.indexOf("omvName")]?.s as string;
    const linesArr = gv[gk.indexOf("lines")]?.a ?? [];

    for (const line of linesArr) {
      const lk = line.p.k;
      const lv = line.p.v;
      const maskedMsisdn = lv[lk.indexOf("maskedMsisdn")]?.s as string;
      lines.push(`${omvName}: ${maskedMsisdn}`);
    }
  }

  const isRegistered = lines.length > 0;

  if (!isRegistered) {
    return {
      company: "Red Altan (MVNOs)",
      possibleProviders: ALTAN_MVNO_PROVIDERS,
      lines,
      isRegistered: false,
    };
  }

  const foundProviders = lines.map((l) =>
    l.slice(0, l.indexOf(": ")).toLowerCase(),
  );
  const notFoundProviders = ALTAN_MVNO_PROVIDERS.filter(
    (p) =>
      !foundProviders.some(
        (f) => p.toLowerCase().includes(f) || f.includes(p.toLowerCase()),
      ),
  );

  return {
    company: "Red Altan (MVNOs)",
    lines,
    isRegistered: true,
    notFoundProviders,
    rawApiResponse: validationData,
  };
}
