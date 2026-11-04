import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const nextConfig: NextConfig = {};

export default withBundleAnalyzer(withNextIntl(nextConfig));
