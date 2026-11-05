import { formatRupees, type HudNote } from "@/lib/hud-store";

/** An invented order book, with no real share behind it. */

export const BEATS = 7;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export interface Order {
  price: number;
  qty: number;
}

/** Best price first: buyers highest, sellers lowest. */
export const BIDS: Order[] = [
  { price: 99.5, qty: 40 },
  { price: 99, qty: 120 },
  { price: 98, qty: 200 },
];
export const ASKS: Order[] = [
  { price: 100.5, qty: 60 },
  { price: 101, qty: 150 },
  { price: 102, qty: 220 },
];

/**
 * A trade needs a buyer willing to pay what a seller will accept, and it fills
 * at the price of the order already waiting. So nothing trades across the gap,
 * and a buyer who simply crosses it pays ₹100.50, not ₹100. For ₹100, a seller
 * has to come down to ₹100 first.
 */
export function matchPrice(buy: number, restingAsk: number) {
  return buy >= restingAsk ? restingAsk : null;
}

export const QTY = 10;
export const MATCH = 100;
export const DEPLOYED = QTY * MATCH;
export const OPENING_LTP = 99.5;
export const WALLET = 2000;

export const SPREAD = ASKS[0].price - BIDS[0].price;

export const BIDS_BEAT = 1;
export const ASKS_BEAT = 2;
export const SELLER_BEAT = 4;
export const MATCH_BEAT = 5;
export const MATCH_TIME = 0.05;
/** The trade prints when the two orders meet. */
export const MATCHED_AT = MATCH_BEAT / BEATS + MATCH_TIME;

export const noteAt = (matched: boolean): HudNote => (matched ? "hudInShares" : "hudAtBroker");

export const formatPrice = (n: number) =>
  "₹" + (Number.isInteger(n) ? String(n) : n.toFixed(2));

export const VALUES: Record<string, string> = {
  wallet: formatRupees(WALLET),
  bids: BIDS.map((o) => formatPrice(o.price)).reverse().join(", "),
  asks: ASKS.map((o) => formatPrice(o.price)).join(", "),
  bestBid: formatPrice(BIDS[0].price),
  bestAsk: formatPrice(ASKS[0].price),
  spread: formatRupees(SPREAD, true),
  match: formatPrice(MATCH),
  qty: String(QTY),
  deployed: formatRupees(DEPLOYED),
};
