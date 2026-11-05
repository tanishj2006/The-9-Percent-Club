import { describe, expect, it } from "vitest";
import { ILLUSTRATIVE_RATE, sipSummary, sipValue } from "./sip";

/** The closed form must equal doing it the long way, month by month. */
function simulate(monthly: number, months: number, annual: number) {
  const r = (1 + annual) ** (1 / 12) - 1;
  let value = 0;
  for (let m = 0; m < months; m++) value = value * (1 + r) + monthly;
  return value;
}

describe("sipValue", () => {
  it.each([
    [2000, 12, 0.1],
    [2000, 120, 0.1],
    [500, 360, 0.1],
    [10000, 60, 0.06],
    [3000, 240, 0.14],
  ])("₹%i for %i months at %f matches a month-by-month run", (monthly, months, rate) => {
    expect(sipValue(monthly, months, rate)).toBeCloseTo(simulate(monthly, months, rate), 4);
  });

  it("the first instalment has not grown yet", () => {
    expect(sipValue(2000, 1)).toBeCloseTo(2000, 8);
  });

  it("at 0% you only get back what you put in", () => {
    expect(sipValue(2000, 120, 0)).toBe(240000);
  });

  it("scales exactly with the monthly amount", () => {
    expect(sipValue(4000, 120)).toBeCloseTo(sipValue(2000, 120) * 2, 6);
  });
});

describe("sipSummary", () => {
  it("₹2,000 for 10 years at the illustrative rate", () => {
    const { putIn, value, growth } = sipSummary(2000, 10);
    expect(ILLUSTRATIVE_RATE).toBe(0.1);
    expect(putIn).toBe(240000);
    expect(Math.round(value)).toBe(399728);
    expect(growth).toBeCloseTo(value - putIn, 8);
  });

  it("growth is imperceptible early and large late, as the copy says", () => {
    const share = (y: number) => sipSummary(2000, y).growth / sipSummary(2000, y).value;
    expect(share(1)).toBeLessThan(0.05);
    expect(share(3)).toBeLessThan(0.15);
    expect(share(10)).toBeGreaterThan(0.35);
  });

  it("each extra year adds more growth than the last", () => {
    const growth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((y) => sipSummary(2000, y).growth);
    for (let i = 2; i < growth.length; i++) {
      expect(growth[i] - growth[i - 1]).toBeGreaterThan(growth[i - 1] - growth[i - 2]);
    }
  });
});
