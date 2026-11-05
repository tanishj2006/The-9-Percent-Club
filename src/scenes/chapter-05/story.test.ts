import { describe, expect, it } from "vitest";
import fixture from "../../../data/cost-reference.json";
import {
  AFTER_TEN_TRIPS,
  BEATS,
  capitalStats,
  SLIDER_BEAT,
  SLIDER_STOPS,
  TEN_TRIPS_COST,
  TIER_BEAT,
  tierAtBeat,
  TIERS,
  VALUES,
} from "./story";

const r6 = (n: number) => Number(n.toFixed(6));

describe("Chapter 05 figures", () => {
  it("reproduces every breakeven tier in cost-reference.json", () => {
    for (const { capital, breakeven_move } of fixture.breakeven) {
      expect(r6(capitalStats(capital).gapPct / 100), `₹${capital}`).toBe(breakeven_move);
    }
  });

  // Outside the fixture's table, so pinned to values printed by running
  // nse-backtester/backtester/costs.py directly.
  it.each([
    [500, 36.512406, 0.073025],
    [1000, 37.624812, 0.037625],
    [1500, 38.737218, 0.025825],
    [7500, 57.98609, 0.007731],
    [75000, 237.6609, 0.003169],
  ])("₹%i matches the Python engine", (capital, cost, move) => {
    const s = capitalStats(capital);
    expect(r6(s.cost)).toBe(cost);
    expect(r6(s.gapPct / 100)).toBe(move);
  });

  it("does not depend on how the capital is split into shares", () => {
    expect(capitalStats(1000).cost).toBeCloseTo(fixture.cases[0].round_trip_total, 5);
  });

  it("anchors: 1.99% at ₹2,000, ten trips about 20%", () => {
    expect(VALUES.pct2000).toBe("1.99");
    expect(VALUES.cost2000).toBe("₹39.85");
    expect(VALUES.tenCost).toBe("₹398.50");
    expect(VALUES.tenPct).toBe("19.9");
    expect(AFTER_TEN_TRIPS.toFixed(2)).toBe("1601.50");
    expect(TEN_TRIPS_COST).toBeCloseTo(398.49624, 5);
  });

  it("makes the claims the copy makes", () => {
    const you = capitalStats(2000).gapPct;
    expect(capitalStats(5000).gapPct, "less than half of yours").toBeLessThan(you / 2);
    expect(capitalStats(50000).gapPct, "less than a fifth").toBeLessThan(you / 5);
    expect(capitalStats(1000).gapPct, "doubling nearly halves it").toBeLessThan(
      capitalStats(500).gapPct * 0.55,
    );
    expect(you, "nearly 2%").toBeGreaterThan(1.9);
    expect(you).toBeLessThan(2);
    expect(VALUES.dpShare).toBe("59");
  });

  it("the gap only ever shrinks as capital grows", () => {
    const gaps = SLIDER_STOPS.map((c) => capitalStats(c).gapPct);
    expect(gaps).toEqual([...gaps].sort((a, b) => b - a));
  });

  it("the slider runs ₹500 to ₹1,00,000 and stops on every tier", () => {
    expect(SLIDER_STOPS[0]).toBe(500);
    expect(SLIDER_STOPS.at(-1)).toBe(100000);
    expect(new Set(SLIDER_STOPS).size).toBe(SLIDER_STOPS.length);
    expect(SLIDER_STOPS).toEqual([...SLIDER_STOPS].sort((a, b) => a - b));
    for (const tier of TIERS) expect(SLIDER_STOPS).toContain(tier);
  });

  it("every tier lands on a beat before the slider", () => {
    for (const tier of TIERS) {
      expect(TIER_BEAT[tier]).toBeLessThan(SLIDER_BEAT);
      expect(tierAtBeat(TIER_BEAT[tier])).toBe(tier);
    }
    expect(tierAtBeat(0)).toBeNull();
    expect(SLIDER_BEAT).toBe(BEATS - 1);
  });
});
