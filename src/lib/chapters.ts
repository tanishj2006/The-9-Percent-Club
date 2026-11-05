/** Chapters that exist, in reading order. Slugs double as route segments. */
export const CHAPTERS = [
  { number: "00", href: "/", titleKey: "ch00" },
  { number: "04", href: "/04", titleKey: "ch04" },
  { number: "05", href: "/05", titleKey: "ch05" },
] as const;

export type ChapterNumber = (typeof CHAPTERS)[number]["number"];
