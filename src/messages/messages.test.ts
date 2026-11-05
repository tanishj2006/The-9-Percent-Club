import { describe, expect, it } from "vitest";
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
    for (const ch of ["ch00", "ch04", "ch05"] as const) {
      expect(hi[ch].beats.map((b) => b.tone)).toEqual(en[ch].beats.map((b) => b.tone));
    }
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
  const banned = /guarante|sure.?shot|you will (make|earn)|join the 9%|beat the market/i;

  it("the new chapters promise nothing", () => {
    for (const [key, value] of Object.entries(flatEn)) {
      expect(value, key).not.toMatch(banned);
    }
  });

  it("the footer disclaimer exists in both languages", () => {
    expect(en.site.disclaimer).toContain("Nothing is advice");
    expect(hi.site.disclaimer).toContain("advice नहीं");
  });
});
