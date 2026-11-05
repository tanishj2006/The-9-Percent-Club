import { describe, expect, it } from "vitest";
import { BEATS, FALL_ORDER, FALL_TO, fallAt, KEPT, KEPT_BEAT, LOST, lostAt, TRADERS, VALUES } from "./story";

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

  it("all 91 are down before the nine turn teal", () => {
    expect(FALL_TO).toBeLessThan(KEPT_BEAT / BEATS);
    expect(lostAt(KEPT_BEAT / BEATS)).toBe(91);
    expect(lostAt(1)).toBe(91);
  });
});
