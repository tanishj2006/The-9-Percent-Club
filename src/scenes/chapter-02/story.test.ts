import { describe, expect, it } from "vitest";
import { ASKS, BEATS, BIDS, DEPLOYED, formatPrice, MATCH, MATCHED_AT, MATCH_BEAT, matchPrice, noteAt, QTY, SPREAD, VALUES, WALLET } from "./story";

describe("the order book", () => {
  it("holds the prices from the brief, best first", () => {
    expect(BIDS.map((o) => o.price)).toEqual([99.5, 99, 98]);
    expect(ASKS.map((o) => o.price)).toEqual([100.5, 101, 102]);
  });

  it("opens with a ₹1 gap", () => {
    expect(SPREAD).toBe(1);
  });

  it("nothing trades while the best buyer is below the best seller", () => {
    expect(matchPrice(BIDS[0].price, ASKS[0].price)).toBeNull();
  });

  it("a trade fills at the waiting order's price", () => {
    // A buyer who simply crosses the book pays the seller's ₹100.50, not ₹100...
    expect(matchPrice(100.5, ASKS[0].price)).toBe(100.5);
    expect(matchPrice(102, ASKS[0].price)).toBe(100.5);
    // ...so ₹100 needs a seller to come down to ₹100 first.
    expect(matchPrice(MATCH, MATCH)).toBe(100);
    expect(MATCH).toBeLessThan(ASKS[0].price);
    expect(MATCH).toBeGreaterThan(BIDS[0].price);
  });

  it("the trade is 10 shares, ₹1,000 of the ₹2,000", () => {
    expect(QTY).toBe(10);
    expect(DEPLOYED).toBe(1000);
    expect(DEPLOYED).toBeLessThanOrEqual(WALLET);
  });

  it("prints inside the match beat, before its middle", () => {
    expect(MATCHED_AT).toBeGreaterThan(MATCH_BEAT / BEATS);
    expect(MATCHED_AT).toBeLessThan((MATCH_BEAT + 0.5) / BEATS);
  });

  it("the HUD note follows the trade", () => {
    expect(noteAt(false)).toBe("hudAtBroker");
    expect(noteAt(true)).toBe("hudInShares");
  });

  it("formats prices the way the brief writes them", () => {
    expect(formatPrice(99.5)).toBe("₹99.50");
    expect(formatPrice(100)).toBe("₹100");
    expect(VALUES).toMatchObject({
      bids: "₹98, ₹99, ₹99.50",
      asks: "₹100.50, ₹101, ₹102",
      spread: "₹1.00",
      match: "₹100",
      deployed: "₹1,000",
    });
  });
});
