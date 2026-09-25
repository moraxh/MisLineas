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
  ],
  // Both paths resolve their binaries at runtime through logic Next.js's
  // static file-tracing analysis can't follow — Sorcel via a constructed
  // path.join() call (src/lib/providers/sorcel.ts), and @sparticuz/chromium
  // via its own internal path/tar-extraction helpers — so both get pruned
  // from the standalone output unless force-included here.
  outputFileTracingIncludes: {
    "/api/lookup": [
      "./node_modules/node-curl-impersonate/bin/**",
      "./node_modules/@sparticuz/chromium/bin/**",
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
