import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

/**
 * Content Security Policy. Next.js streams page data in inline <script> tags
 * (about 290 distinct ones across the site) and next-themes sets the theme with
 * another, so hashes are impractical and a nonce would force every page to be
 * rendered per request. Scripts therefore allow 'unsafe-inline' from this
 * origin only. 'unsafe-eval' is never allowed in production; development only, for the dev server.
 */
// Next's dev server and hot reload need eval and a websocket. Production never
// gets either, so the strict policy stays where it matters.
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Vercel Web Analytics posts to /_vercel/insights on this origin.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// Previews and development deploys on Vercel: keep them out of every index.
const indexable = (process.env.VERCEL_ENV ?? "production") === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: indexable
          ? securityHeaders
          : [...securityHeaders, { key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // Lets the e2e suite build beside a running `npm run dev` without either
  // overwriting the other's files in .next.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // HarfBuzz is WebAssembly, used only when share cards are generated.
  serverExternalPackages: ["harfbuzzjs"],
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
