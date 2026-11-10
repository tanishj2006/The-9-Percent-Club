import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import {
  BEATS,
  FALL_ORDER,
  FALL_TO,
  fallAt,
  KEPT,
  KEPT_BEAT,
  LATER_BEAT,
  LOSS_BEAT,
  LOST,
  lostAt,
  TRADERS,
  VALUES,
} from "./story";

describe("Chapter 07 figures", () => {
  it("is 91 and 9 of 100", () => {
    expect(LOST).toBe(91);
    expect(KEPT).toHaveLength(9);
    expect(FALL_ORDER).toHaveLength(91);
    expect(VALUES).toMatchObject({ lost: "91", kept: "9", loss: "₹1,05,603" });
  });

  it("every figure is in exactly one group", () => {
    const all = [...KEPT, ...FALL_ORDER].sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: TRADERS }, (_, i) => i));
  });

  it("the count matches when each figure actually falls", () => {
    expect(lostAt(0)).toBe(0);
    FALL_ORDER.forEach((_, n) => {
      expect(lostAt(fallAt(n) + 1e-9), `figure ${n}`).toBe(n + 1);
    });
  });

  it("all 91 are down before the middle of the beat that says so", () => {
    expect(lostAt((2 + 0.5) / BEATS)).toBe(91);
  });

  it("all 91 are down before the nine turn teal", () => {
    expect(FALL_TO).toBeLessThan(KEPT_BEAT / BEATS);
    expect(lostAt(KEPT_BEAT / BEATS)).toBe(91);
    expect(lostAt(1)).toBe(91);
  });
});

describe("91% is labelled as FY25, and is not the last word", () => {
  it("figures match SEBI's two studies", () => {
    // July 2025, PR 39/2025, and August 2026, "Profitability of Individual
    // Traders in the Equity Derivatives Segment (FY25–FY26)".
    expect(VALUES).toMatchObject({
      lost: "91",
      loss: "₹1,05,603",
      fy26Pct: "87.7",
      fy26Loss: "₹91,685",
      fy25RevisedPct: "90.9",
      fy25RevisedLoss: "₹1,11,788",
    });
  });

  it("every prominent 91% carries FY25, in both languages", () => {
    for (const copy of [en, hi]) {
      for (const text of [
        copy.nav.ch07,
        copy.meta.ch07,
        copy.ch07.title,
        copy.ch07.countLabel,
        copy.ch07.beats[2].h,
        copy.ch07.beats[LOSS_BEAT].h,
        copy.site.hudLostCount,
      ]) {
        expect(text).toContain("FY25");
      }
    }
  });

  it("a visible beat after the total gives FY26", () => {
    expect(LATER_BEAT).toBe(LOSS_BEAT + 1);
    expect(LATER_BEAT).toBeLessThan(BEATS - 1);
    for (const copy of [en, hi]) {
      const beat = copy.ch07.beats[LATER_BEAT];
      expect(beat.tag).toBe("FY26");
      expect(beat.p).toContain("{fy26Pct}%");
      expect(beat.p).toContain("{fy26Loss}");
      expect(copy.ch07.beats).toHaveLength(BEATS);
    }
  });

  it("the FY26 beat makes no case for joining the minority", () => {
    const text = `${en.ch07.beats[LATER_BEAT].h} ${en.ch07.beats[LATER_BEAT].p}`;
    expect(text).not.toMatch(/made money|profit|win|beat|chance|could be|12\.3/i);
    expect(text).toMatch(/does not mean trading got better/);
  });
});
