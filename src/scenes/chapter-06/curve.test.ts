import { describe, expect, it } from "vitest";
import { LAST_AT, TROUGH_AT } from "@/lib/drawdown";
import { AFTERMATH, CRASH, CRASH_VIEW, FULL_VIEW, H, VALUES, W, xOf, yOf } from "./curve";

describe("Chapter 06 chart geometry", () => {
  it("draws nothing at the start and everything at the end of each path", () => {
    expect(CRASH.drawn(0)).toBe(0);
    expect(CRASH.drawn(TROUGH_AT)).toBeCloseTo(1, 8);
    expect(AFTERMATH.drawn(TROUGH_AT)).toBe(0);
    expect(AFTERMATH.drawn(LAST_AT)).toBeCloseTo(1, 8);
  });

  it("drawn fraction only ever grows", () => {
    for (let at = 1; at <= LAST_AT; at++) {
      expect(AFTERMATH.drawn(at)).toBeGreaterThanOrEqual(AFTERMATH.drawn(at - 1));
    }
  });

  it("everything stays inside the chart in both views", () => {
    for (let at = 0; at <= TROUGH_AT; at++) {
      expect(xOf(at, CRASH_VIEW)).toBeLessThanOrEqual(W);
    }
    expect(yOf(1439.6, CRASH_VIEW)).toBeLessThan(H);
    expect(yOf(7249, FULL_VIEW)).toBeGreaterThan(0);
  });

  it("gives the crash its own close-up: 42 days are not lost on a six-year axis", () => {
    expect(xOf(TROUGH_AT, FULL_VIEW) / W).toBeLessThan(0.04);
    expect(xOf(TROUGH_AT, CRASH_VIEW) / W).toBeGreaterThan(0.95);
  });

  it("copy figures match the brief", () => {
    expect(VALUES).toMatchObject({
      wallet: "₹2,000",
      bottom: "₹1,439.60",
      bottomRound: "₹1,440",
      final: "₹6,128",
      fallPct: "28.02",
      fallDays: "42",
      recoverDays: "136",
      gainPct: "325",
    });
  });
});
