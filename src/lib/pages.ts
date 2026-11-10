/** The four pages that explain the site, as opposed to chapters of the course. */
export const INFO_PAGES = [
  { href: "/about", key: "about" },
  { href: "/methodology", key: "methodology" },
  { href: "/terms", key: "terms" },
  { href: "/privacy", key: "privacy" },
] as const;

export type InfoPageKey = (typeof INFO_PAGES)[number]["key"];
