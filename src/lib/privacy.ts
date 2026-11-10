/**
 * What the site stores on a reader's device, by its real name. The privacy page
 * renders this list and e2e/trust.spec.ts checks it against a real browser, so
 * the page cannot drift from what the code does.
 */
export const STORED = [
  { name: "npc-theme", kind: "localStorage", key: "theme" },
  { name: "NEXT_LOCALE", kind: "cookie", key: "locale" },
] as const;

export const VERCEL_ANALYTICS_PRIVACY = "https://vercel.com/docs/analytics/privacy-policy";
