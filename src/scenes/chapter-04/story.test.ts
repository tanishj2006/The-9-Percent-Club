import { describe, expect, it } from "vitest";
import fixture from "../../../data/cost-reference.json";
import {
  AFTER_CUT,
  BEAT_MONEY,
  BEAT_NOTE,
  BEATS,
  CUTS,
  KEPT,
  ROWS,
  TOTAL_COST,
  TRADE,
  VALUES,
} from "./story";

const anchor = fixture.cases.find((c) => c.qty === 10 && c.price === 100)!;
const r6 = (n: number) => Number(n.toFixed(6));

describe("Chapter 04 figures against cost-reference.json", () => {
  it("is the ₹1,000 anchor case", () => {
    expect(TRADE).toBe(anchor.buy.turnover);
    expect(r6(TOTAL_COST)).toBe(anchor.round_trip_total);
  });

  it("each receipt row equals the fixture's buy + sell fields", () => {
    const fields = {
      brokerage: "brokerage",
      dp: "dp_charge",
      stt: "stt",
      gst: "gst",
      stamp: "stamp_duty",
      exchange: "exchange_txn",
      sebi: "sebi_fee",
    } as const;
    for (const row of ROWS) {
      const field = fields[row.id];
      expect(r6(row.amount), row.id).toBe(r6(anchor.buy[field] + anchor.sell[field]));
    }
  });

  it("the rows and the cuts each sum to the whole total", () => {
    expect(r6(ROWS.reduce((sum, r) => sum + r.amount, 0))).toBe(anchor.round_trip_total);
    expect(r6(CUTS.reduce((sum, c) => sum + c.amount, 0))).toBe(anchor.round_trip_total);
  });

  it("the displayed rows add up to the displayed total", () => {
    const shown = ROWS.reduce((sum, r) => sum + Number(r.amount.toFixed(2)), 0);
    expect(shown.toFixed(2)).toBe("37.62");
  });

  it("walks the note down to ₹962.38", () => {
    expect(AFTER_CUT.map((n) => n.toFixed(2))).toEqual([
      "990.00",
      "966.40",
      "964.40",
      "962.38",
    ]);
    expect(KEPT.toFixed(2)).toBe("962.38");
  });

  it("has a HUD value and note for every beat", () => {
    expect(BEAT_MONEY).toHaveLength(BEATS);
    expect(BEAT_NOTE).toHaveLength(BEATS);
    expect(BEAT_MONEY[0]).toBe(2000);
    expect(BEAT_MONEY[1]).toBe(1000);
  });

  it("copy figures match the brief", () => {
    expect(VALUES).toMatchObject({
      total: "₹37.62",
      kept: "₹962.38",
      dp: "₹23.60",
      dpPct: "2.36",
      lostPct: "3.76",
      brokerage: "₹10.00",
      stt: "₹2.00",
      rest: "₹2.02",
      sebi: "₹0.002", // not ₹0.00
    });
  });
});
