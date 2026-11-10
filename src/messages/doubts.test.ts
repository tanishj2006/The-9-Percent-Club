import { describe, expect, it } from "vitest";
import { VALUES as V1 } from "../scenes/chapter-01/story";
import { VALUES as V2 } from "../scenes/chapter-02/story";
import { VALUES as V3 } from "../scenes/chapter-03/story";
import { VALUES as V4 } from "../scenes/chapter-04/story";
import { VALUES as V5 } from "../scenes/chapter-05/story";
import { VALUES as V6 } from "../scenes/chapter-06/curve";
import { VALUES as V7 } from "../scenes/chapter-07/story";
import { VALUES as V8 } from "../scenes/chapter-08/story";
import { CHAPTERS } from "../lib/chapters";
import en from "./en.json";
import hi from "./hi.json";

const VALUES: Record<string, Record<string, string>> = {
  ch00: {},
  ch01: V1,
  ch02: V2,
  ch03: V3,
  ch04: V4,
  ch05: V5,
  ch06: V6,
  ch07: V7,
  ch08: V8,
};

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
const fill = (s: string, v: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, key) => v[key] ?? `{${key}}`);

const keys = CHAPTERS.map((c) => c.titleKey);

describe("doubts in both languages", () => {
  it.each(keys)("%s has 3 to 4 doubts, the same number in English and Hindi", (key) => {
    expect(en.doubts[key].length).toBeGreaterThanOrEqual(3);
    expect(en.doubts[key].length).toBeLessThanOrEqual(4);
    expect(hi.doubts[key]).toHaveLength(en.doubts[key].length);
  });

  it.each(keys)("%s uses the same figures in both languages", (key) => {
    en.doubts[key].forEach((doubt, i) => {
      const other = hi.doubts[key][i];
      expect(placeholders(other.q).sort(), `q${i}`).toEqual(placeholders(doubt.q).sort());
      expect(placeholders(other.a).sort(), `a${i}`).toEqual(placeholders(doubt.a).sort());
    });
  });

  it.each(keys)("%s: every figure resolves against that chapter's values", (key) => {
    for (const doubt of [...en.doubts[key], ...hi.doubts[key]]) {
      for (const name of [...placeholders(doubt.q), ...placeholders(doubt.a)]) {
        expect(VALUES[key][name], `{${name}}`).toBeDefined();
      }
    }
  });

  it("every question is a question, and no answer is empty", () => {
    for (const copy of [en, hi]) {
      for (const key of keys) {
        for (const { q, a } of copy.doubts[key]) {
          expect(q.trim().endsWith("?"), q).toBe(true);
          expect(a.length).toBeGreaterThan(40);
          expect(a, "ICU would read this as a tag").not.toContain("<");
        }
      }
    }
  });

  it("the Hindi is actually Hindi", () => {
    for (const key of keys) {
      for (const { q, a } of hi.doubts[key]) {
        expect(q + a).toMatch(/[ऀ-ॿ]/);
      }
    }
  });
});

describe("the doubts the brief asked for", () => {
  it("Chapter 01 covers the broker shutting down", () => {
    expect(en.doubts.ch01[0].q).toContain("shuts down tomorrow");
    expect(en.doubts.ch01[0].a).toContain("They stay yours");
  });

  it("Chapter 04 corrects the zero-brokerage premise with engine figures", () => {
    const { q, a } = en.doubts.ch04[0];
    expect(fill(q, V4)).toContain("₹37.62");
    const answer = fill(a, V4);
    expect(answer).toContain("₹10.00 of brokerage");
    // nse-backtester/backtester/costs.py, with brokerage set to zero.
    expect(answer).toContain("₹25.82");
  });

  it("Chapter 04's two-trades answer matches costs.py", () => {
    expect(fill(en.doubts.ch04[2].a, V4)).toContain("₹73.02");
  });

  it("Chapter 05's no-DP gap matches costs.py", () => {
    expect(fill(en.doubts.ch05[1].a, V5)).toContain("0.81%");
  });

  it("Chapter 07 says the 91% does not cover SIPs", () => {
    expect(en.doubts.ch07[0].q).toContain("mutual fund SIPs");
    expect(en.doubts.ch07[0].a.startsWith("No.")).toBe(true);
  });
});

describe("SEBI: doubts stay education", () => {
  const all = keys.flatMap((key) => [...en.doubts[key], ...hi.doubts[key]]);
  const text = all.map(({ q, a }) => `${q} ${a}`).join("\n");

  it("names no company or broker", () => {
    expect(text).not.toMatch(
      /adani|reliance|tata|infosys|hdfc|icici|zerodha|groww|upstox|angel one|अडानी|रिलायंस/i,
    );
  });

  it("makes no promise and gives no instruction to buy or sell", () => {
    expect(text).not.toMatch(/guaranteed (return|profit)|you will (make|earn)|you should (buy|sell|invest)/i);
    expect(text).not.toMatch(/sure.?shot/i);
  });

  it("says it is not advice on the section itself", () => {
    expect(en.doubts.note).toContain("not advice");
    expect(hi.doubts.note).toContain("advice नहीं");
  });

  it("the fund question names no fund and refuses to pick", () => {
    expect(en.doubts.ch08[2].a).toContain("does not name or recommend any fund");
  });
});
