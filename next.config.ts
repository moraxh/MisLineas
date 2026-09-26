import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: [
    "puppeteer-core",
    "@sparticuz/chromium",
    "node-curl-impersonate",
    "fingerprint-generator",
    "fingerprint-injector",
    "header-generator",
    "generative-bayesian-network",
  ],
  // All three paths resolve their binaries/data files at runtime through
  // logic Next.js's static file-tracing analysis can't follow — Sorcel via a
  // constructed path.join() call (src/lib/providers/sorcel.ts),
  // @sparticuz/chromium via its own internal path/tar-extraction helpers,
  // and fingerprint-generator/header-generator (AT&T's fingerprint spoofing)
  // via __dirname-relative reads of their data_files/*.json — so all get
  // pruned from the standalone output unless force-included here.
  outputFileTracingIncludes: {
    "/api/lookup": [
      "./node_modules/node-curl-impersonate/bin/**",
      "./node_modules/@sparticuz/chromium/bin/**",
      // fingerprint-generator requires header-generator (and it in turn
      // generative-bayesian-network) across a pnpm symlink Next.js's file
      // tracer doesn't follow — only the data_files it can see referenced by
      // path.join() calls get copied, leaving the actual .js/package.json
      // missing at runtime ("Cannot find module 'header-generator'"). Force
      // the full packages in, not just their data files.
      "./node_modules/fingerprint-generator/**",
      "./node_modules/fingerprint-injector/**",
      "./node_modules/header-generator/**",
      "./node_modules/generative-bayesian-network/**",
    ],
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
