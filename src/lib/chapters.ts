/** Chapters that exist, in reading order. Slugs double as route segments. */
export const CHAPTERS = [
  { number: "00", href: "/", titleKey: "ch00" },
  { number: "01", href: "/01", titleKey: "ch01" },
  { number: "02", href: "/02", titleKey: "ch02" },
  { number: "03", href: "/03", titleKey: "ch03" },
  { number: "04", href: "/04", titleKey: "ch04" },
  { number: "05", href: "/05", titleKey: "ch05" },
  { number: "06", href: "/06", titleKey: "ch06" },
  { number: "07", href: "/07", titleKey: "ch07" },
  { number: "08", href: "/08", titleKey: "ch08" },
] as const;

export type ChapterNumber = (typeof CHAPTERS)[number]["number"];
