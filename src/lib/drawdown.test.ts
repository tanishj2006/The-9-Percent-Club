import { describe, expect, it } from "vitest";
import data from "../../data/drawdown-2020.json";
import {
  BOTTOM_MONEY,
  FALL_DAYS,
  FALL_PCT,
  FINAL_MONEY,
  GAIN_FROM_BOTTOM_PCT,
  LAST_AT,
  moneyAt,
  POINTS,
  RECOVER_AT,
  RECOVER_DAYS,
  START_MONEY,
  TROUGH_AT,
} from "./drawdown";

const days = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;

describe("the 2020 window, as quoted in CLAUDE.md", () => {
  it("peaks on 11 Feb and bottoms on 24 Mar 2020", () => {
    expect(POINTS[0].date).toBe("2020-02-11");
    expect(POINTS[TROUGH_AT].date).toBe("2020-03-24");
  });

  it("the dates in the file agree with its own day counts", () => {
    expect(days(POINTS[0].date, POINTS[TROUGH_AT].date)).toBe(FALL_DAYS);
    expect(FALL_DAYS).toBe(42);
    expect(days(POINTS[TROUGH_AT].date, POINTS[RECOVER_AT].date)).toBe(RECOVER_DAYS);
    expect(RECOVER_DAYS).toBe(136);
  });

  it("the fall recomputed from raw values is 28.02%", () => {
    const { value: peak } = POINTS[0];
    const { value: trough } = POINTS[TROUGH_AT];
    expect(((1 - trough / peak) * 100).toFixed(2)).toBe("28.02");
    expect(FALL_PCT.toFixed(2)).toBe("28.02");
  });

  it("the peak and trough are the real extremes of the window", () => {
    const window = POINTS.slice(0, TROUGH_AT + 1).map((p) => p.value);
    expect(Math.max(...window)).toBe(POINTS[0].value);
    expect(Math.min(...window)).toBe(POINTS[TROUGH_AT].value);
  });

  it("recovery is the first point back above the peak", () => {
    expect(POINTS[RECOVER_AT].value).toBeGreaterThan(POINTS[0].value);
    for (let i = 1; i < RECOVER_AT; i++) {
      expect(POINTS[i].value).toBeLessThan(POINTS[0].value);
    }
  });

  it("the gain from the bottom is over 325%", () => {
    const raw = (POINTS[LAST_AT].value / POINTS[TROUGH_AT].value - 1) * 100;
    expect(raw).toBeCloseTo(325.68, 1);
    expect(GAIN_FROM_BOTTOM_PCT).toBeCloseTo(raw, 1);
  });
});

describe("rupees on the HUD", () => {
  it("starts at ₹2,000 and bottoms at ₹1,439.60", () => {
    expect(moneyAt(0)).toBe(START_MONEY);
    expect(BOTTOM_MONEY.toFixed(2)).toBe("1439.60");
    expect(moneyAt(TROUGH_AT).toFixed(2)).toBe("1439.60");
    expect(Math.round(moneyAt(TROUGH_AT))).toBe(1440);
  });

  it("is within a rupee of the raw curve everywhere", () => {
    POINTS.forEach((p, i) => {
      const raw = (START_MONEY * p.value) / POINTS[0].value;
      expect(Math.abs(moneyAt(i) - raw), p.date).toBeLessThan(1);
    });
  });

  it("is back above ₹2,000 at recovery", () => {
    expect(moneyAt(RECOVER_AT)).toBeGreaterThan(START_MONEY);
    expect(moneyAt(RECOVER_AT - 1)).toBeLessThan(START_MONEY);
  });

  it("ends at the bottom's value plus the quoted gain", () => {
    expect(FINAL_MONEY).toBeCloseTo(BOTTOM_MONEY * (1 + data.gain_from_trough), 0);
    expect(Math.round(FINAL_MONEY)).toBe(6128);
  });

  it("interpolates between points and clamps at the ends", () => {
    const mid = moneyAt(1.5);
    expect(mid).toBeLessThan(moneyAt(1));
    expect(mid).toBeGreaterThan(moneyAt(2));
    expect(moneyAt(-5)).toBe(moneyAt(0));
    expect(moneyAt(LAST_AT + 5)).toBe(moneyAt(LAST_AT));
  });
});
