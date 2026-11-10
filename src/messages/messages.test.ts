import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../lib/chapters";
import en from "./en.json";
import hi from "./hi.json";

type Tree = { [key: string]: Tree | string };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((out, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
    return out;
  }, {});
}

const flatEn = flatten(en as unknown as Tree);
const flatHi = flatten(hi as unknown as Tree);
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("both languages are first class", () => {
  it("have exactly the same keys", () => {
    expect(Object.keys(flatHi).sort()).toEqual(Object.keys(flatEn).sort());
  });

  it("use the same computed figures in every string", () => {
    for (const key of Object.keys(flatEn)) {
      expect(placeholders(flatHi[key]), key).toEqual(placeholders(flatEn[key]));
    }
  });

  it("have matching beat tones, so colour means the same in both", () => {
    for (const ch of ["ch00", "ch01", "ch02", "ch03", "ch04", "ch05", "ch06", "ch07", "ch08"] as const) {
      expect(hi[ch].beats.map((b) => b.tone)).toEqual(en[ch].beats.map((b) => b.tone));
    }
  });
});

describe("the finished course", () => {
  it("has no leftover note about unwritten chapters", () => {
    for (const [key, value] of [...Object.entries(flatEn), ...Object.entries(flatHi)]) {
      expect(value, key).not.toMatch(/still being written|लिखे जा रहे/);
      expect(key).not.toBe("nav.skipNote");
    }
  });

  it("names every chapter in both languages", () => {
    for (const { titleKey } of CHAPTERS) {
      expect(en.nav[titleKey], titleKey).toBeTruthy();
      expect(hi.nav[titleKey], titleKey).toBeTruthy();
    }
  });

  it("Chapter 04 no longer claims the market starts there", () => {
    expect(en.ch04.tagline).not.toContain("This is the real market");
    expect(en.ch04.tagline).toContain("₹103");
    expect(hi.ch04.tagline).toContain("₹103");
  });
});

describe("the summer arithmetic is airtight", () => {
  const stake = 2000;
  const profit = 120000;

  it("2% of ₹1,20,000 plus the ₹2,000 stake is ₹4,400", () => {
    expect(profit * 0.02 + stake).toBe(4400);
  });

  it("the copy says so in both languages", () => {
    for (const copy of [en.ch00, hi.ch00]) {
      expect(copy.beats[5].p).toContain("₹1,20,000");
      expect(copy.beats[6].p).toContain("₹4,400");
    }
  });
});

describe("SEBI: no performance claims", () => {
  const banned = /guaranteed (return|profit)|sure.?shot|you will (make|earn)|join the 9%/i;

  it("the new chapters promise nothing", () => {
    for (const [key, value] of Object.entries(flatEn)) {
      expect(value, key).not.toMatch(banned);
    }
  });

  it("the footer disclaimer exists in both languages, and covers registration", () => {
    expect(en.footer.disclaimer).toContain("not investment advice");
    expect(en.footer.disclaimer).toContain("not a SEBI-registered investment adviser or research analyst");
    expect(en.footer.disclaimer).toContain("Past data does not predict the future");
    expect(hi.footer.disclaimer).toContain("advice नहीं");
    expect(hi.footer.disclaimer).toContain("SEBI में registered");
  });
});
