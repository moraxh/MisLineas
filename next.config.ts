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
      "connect-src 'self' https://api.mislineas.com.mx",
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
    "@sparticuz/chromium-min",
    "node-curl-impersonate",
  ],
  // Sorcel resolves this binary via a runtime-constructed path.join() call
  // (src/lib/providers/sorcel.ts), invisible to Next.js's static file-tracing
  // analysis — force-include it so it survives standalone output pruning.
  outputFileTracingIncludes: {
    "/api/lookup": ["./node_modules/node-curl-impersonate/bin/**"],
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
