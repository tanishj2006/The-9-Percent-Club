import { describe, expect, it } from "vitest";
import fixture from "../../data/cost-reference.json";
import {
  breakevenMove,
  GROWW,
  legCost,
  roundTripCost,
  STATUTORY_RATES,
  ZERO_COST,
  ZERO_RATES,
  ZERODHA,
  type CostBreakdown,
} from "./costs";

/** The fixture stores values rounded to 6 places; compare at that precision. */
const r6 = (n: number) => Number(n.toFixed(6));

/** Maps our camelCase breakdown onto the fixture's Python field names. */
const asFixture = (c: CostBreakdown) => ({
  turnover: r6(c.turnover),
  brokerage: r6(c.brokerage),
  stt: r6(c.stt),
  exchange_txn: r6(c.exchangeTxn),
  sebi_fee: r6(c.sebiFee),
  stamp_duty: r6(c.stampDuty),
  gst: r6(c.gst),
  dp_charge: r6(c.dpCharge),
  total: r6(c.total),
});

describe("rates match the reference engine", () => {
  it("statutory rates", () => {
    expect(STATUTORY_RATES.sttDelivery).toBe(fixture.rates.stt_delivery);
    expect(STATUTORY_RATES.exchangeTxnNse).toBe(fixture.rates.exchange_txn_nse);
    expect(STATUTORY_RATES.sebiTurnover).toBe(fixture.rates.sebi_turnover);
    expect(STATUTORY_RATES.stampDeliveryBuy).toBe(fixture.rates.stamp_delivery_buy);
    expect(STATUTORY_RATES.gstRate).toBe(fixture.rates.gst_rate);
  });

  it("broker rates", () => {
    expect(GROWW.deliveryFlat).toBe(fixture.rates.brokerage_flat);
    expect(GROWW.deliveryPct).toBe(fixture.rates.brokerage_pct);
    expect(GROWW.deliveryMin).toBe(fixture.rates.brokerage_min);
    expect(GROWW.dpChargePerSell).toBe(fixture.rates.dp_charge_per_sell);
  });
});

describe("cost-reference.json cases", () => {
  it("covers every case in the fixture", () => {
    expect(fixture.cases).toHaveLength(7);
    expect(fixture.breakeven).toHaveLength(7);
  });

  for (const c of fixture.cases) {
    describe(`${c.qty} @ ₹${c.price}`, () => {
      it("buy leg, every field", () => {
        expect(asFixture(legCost("buy", c.qty, c.price))).toEqual(c.buy);
      });
      it("sell leg, every field", () => {
        expect(asFixture(legCost("sell", c.qty, c.price))).toEqual(c.sell);
      });
      it("round trip total", () => {
        expect(r6(roundTripCost(c.qty, c.price, c.price).total)).toBe(
          c.round_trip_total,
        );
      });
    });
  }

  for (const b of fixture.breakeven) {
    it(`₹${b.capital} breakeven move`, () => {
      expect(r6(breakevenMove(b.shares_of_1000, 1000))).toBe(b.breakeven_move);
    });
  }
});

describe("anchors quoted in CLAUDE.md", () => {
  it("₹1,000 round trip is ₹37.62, of which ₹23.60 is the DP charge", () => {
    const { total, sell } = roundTripCost(10, 100, 100);
    expect(total.toFixed(2)).toBe("37.62");
    expect(sell.dpCharge).toBe(23.6);
  });

  it("chapter 04's HUD lands on ₹962.38", () => {
    expect((1000 - roundTripCost(10, 100, 100).total).toFixed(2)).toBe("962.38");
  });

  it("₹2,000 breakeven is 1.99%", () => {
    expect((breakevenMove(2, 1000) * 100).toFixed(2)).toBe("1.99");
  });
});

describe("edges ported from the Python engine", () => {
  it("rejects negative quantity", () => {
    expect(() => legCost("buy", -1, 100)).toThrow(RangeError);
  });

  it("zero turnover costs nothing, including the flat DP charge", () => {
    expect(legCost("sell", 0, 100).total).toBe(0);
  });

  it("zero capital never breaks even", () => {
    expect(breakevenMove(0, 100)).toBe(Infinity);
  });

  it("charges intraday STT on the sell leg only, and no DP charge", () => {
    expect(legCost("buy", 10, 100, "intraday").stt).toBe(0);
    expect(legCost("sell", 10, 100, "intraday").stt).toBeCloseTo(0.25, 10);
    expect(legCost("sell", 10, 100, "intraday").dpCharge).toBe(0);
  });

  it("treats a zero flat or pct as no cap, not as free", () => {
    // Zerodha intraday: 0.03% capped at Rs 20, no minimum.
    expect(legCost("buy", 10, 100, "intraday", ZERODHA).brokerage).toBeCloseTo(0.3, 10);
    expect(legCost("buy", 1000, 1000, "intraday", ZERODHA).brokerage).toBe(20);
    // Zerodha delivery: genuinely free.
    expect(legCost("buy", 10, 100, "delivery", ZERODHA).brokerage).toBe(0);
  });

  it("ZERO_COST waives only the broker; statutory charges remain", () => {
    expect(legCost("buy", 10, 100, "delivery", ZERO_COST).stt).toBe(1);
    expect(
      legCost("buy", 10, 100, "delivery", ZERO_COST, ZERO_RATES).total,
    ).toBe(0);
  });
});
