import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  // Lets the e2e suite build beside a running `npm run dev` without either
  // overwriting the other's files in .next.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // HarfBuzz is WebAssembly, used only when share cards are generated.
  serverExternalPackages: ["harfbuzzjs"],
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
