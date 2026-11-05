import { describe, expect, it } from "vitest";
import { sipValue } from "@/lib/sip";
import { BEAT_MONTH, BEATS, FINAL, MONTHLY_STOPS, VALUES, YEAR_STOPS } from "./story";

describe("Chapter 08 story", () => {
  it("has a month for every beat, never going backwards", () => {
    expect(BEAT_MONTH).toHaveLength(BEATS);
    expect(BEAT_MONTH).toEqual([...BEAT_MONTH].sort((a, b) => a - b));
  });

  it("starts at ₹2,000, the same place as every chapter", () => {
    expect(sipValue(2000, BEAT_MONTH[0])).toBeCloseTo(2000, 6);
  });

  it("ends higher than the HUD reaches in any earlier chapter", () => {
    expect(FINAL).toBeGreaterThan(6128);
    expect(FINAL).toBeGreaterThan(4400);
  });

  it("controls cover ₹500 to ₹10,000 and include the story's numbers", () => {
    expect(MONTHLY_STOPS[0]).toBe(500);
    expect(MONTHLY_STOPS.at(-1)).toBe(10000);
    expect(MONTHLY_STOPS).toContain(2000);
    expect(YEAR_STOPS).toContain(10);
  });

  it("copy figures come from the calculation", () => {
    expect(VALUES).toMatchObject({
      monthly: "₹2,000",
      rate: "10",
      put10: "₹2,40,000",
      value10: "₹3,99,728",
      growth10: "₹1,59,728",
      growthShare10: "40",
    });
  });
});
