import { describe, expect, it } from "vitest";
import { BEATS, candleAt, CANDLES, CLOSE_AT, DAY, HIGH_AT, LOW_AT, moneyAt, priceAt, RED_DAY, STRETCH_TIME, VALUES, YOUR_DAY } from "./story";

describe("the invented day", () => {
  it("runs 9:15 to 3:30 in 15-minute steps", () => {
    expect((DAY.length - 1) * 15).toBe(375);
  });

  it("is open ₹100, low ₹96, high ₹106, close ₹103", () => {
    expect(YOUR_DAY).toEqual({ open: 100, low: 96, high: 106, close: 103 });
    expect(Math.min(...DAY)).toBe(96);
    expect(Math.max(...DAY)).toBe(106);
  });

  it("dips before it spikes", () => {
    expect(LOW_AT).toBeLessThan(HIGH_AT);
    expect(HIGH_AT).toBeLessThan(CLOSE_AT);
  });

  it("each stretch finishes before the middle of its beat", () => {
    expect(STRETCH_TIME).toBeLessThan(0.5 / BEATS);
  });
});

describe("the candle is a summary of the line so far", () => {
  it("starts as just the open", () => {
    expect(candleAt(0)).toEqual({ open: 100, high: 100, low: 100, close: 100 });
  });

  it("the wicks never shrink as the day goes on", () => {
    let last = candleAt(0);
    for (let at = 0.5; at <= CLOSE_AT; at += 0.5) {
      const c = candleAt(at);
      expect(c.high).toBeGreaterThanOrEqual(last.high);
      expect(c.low).toBeLessThanOrEqual(last.low);
      expect(c.close).toBeCloseTo(priceAt(at), 8);
      last = c;
    }
  });

  it("matches the brief at each stop", () => {
    expect(candleAt(LOW_AT)).toMatchObject({ low: 96, high: 100, close: 96 });
    expect(candleAt(HIGH_AT)).toMatchObject({ low: 96, high: 106, close: 106 });
    expect(candleAt(CLOSE_AT).close).toBe(103);
  });

  it("interpolates between points while animating", () => {
    expect(priceAt(0.5)).toBeCloseTo(99.6, 8);
    expect(candleAt(0.5).low).toBeCloseTo(99.6, 8);
  });
});

describe("the row of 20", () => {
  it("has 20 valid candles", () => {
    expect(CANDLES).toHaveLength(20);
    for (const c of CANDLES) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
    }
  });

  it("each day opens where the last closed", () => {
    for (let i = 1; i < CANDLES.length; i++) {
      expect(CANDLES[i].open, `day ${i}`).toBe(CANDLES[i - 1].close);
    }
  });

  it("ends on your day, with both colours in the row", () => {
    expect(CANDLES.at(-1)).toEqual(YOUR_DAY);
    expect(CANDLES.some((c) => c.close > c.open)).toBe(true);
    expect(CANDLES.some((c) => c.close < c.open)).toBe(true);
  });
});

describe("the money", () => {
  it("is ₹1,000 cash plus 10 shares", () => {
    expect(moneyAt(100)).toBe(2000);
    expect(moneyAt(96)).toBe(1960);
    expect(moneyAt(106)).toBe(2060);
    expect(moneyAt(103)).toBe(2030);
  });

  it("a red day closes lower than it opened", () => {
    expect(RED_DAY.close).toBeLessThan(RED_DAY.open);
  });

  it("copy figures match", () => {
    expect(VALUES).toMatchObject({
      open: "₹100",
      low: "₹96",
      high: "₹106",
      close: "₹103",
      lowMoney: "₹1,960",
      highMoney: "₹2,060",
      closeMoney: "₹2,030",
      days: "20",
    });
  });
});
