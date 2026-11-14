/**
 * Google AdSense loader.
 *
 * One script on every page. It does three jobs: it proves ownership of the site
 * to AdSense, it is what the review crawler looks for, and once the site is
 * approved it places Auto ads by itself. Auto ads need no per-slot markup, so
 * there is none here; a fixed slot would need an ad unit ID created in the
 * AdSense dashboard first.
 *
 * A plain async <script> rather than next/script: React hoists it into <head>
 * of the HTML the server sends, so a crawler that does not run JavaScript still
 * sees it. next/script's beforeInteractive would do the same but trips an
 * ESLint rule, and its other strategies inject the tag only after hydration.
 *
 * Production only. Previews and local runs must not call ads: impressions from
 * a developer's own browser are what gets an AdSense account suspended.
 */
const CLIENT = "ca-pub-9016164271070357";

export function AdSense() {
  if (process.env.VERCEL_ENV !== "production") return null;
  return (
    <script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
    />
  );
}
