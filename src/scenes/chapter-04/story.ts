import { formatCost, formatRupees, type HudNote } from "@/lib/hud-store";
import { roundTripCost } from "@/lib/costs";

/**
 * Every figure in Chapter 04 comes from costs.ts: one delivery round trip of
 * 10 shares at ₹100, sold at the same price. No GSAP here; the server page and
 * the placeholder import this file too.
 */

export const BEATS = 7;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const WALLET = 2000;
export const QTY = 10;
export const PRICE = 100;

const { buy, sell, total } = roundTripCost(QTY, PRICE, PRICE);

export const TRADE = buy.turnover;
export const TOTAL_COST = total;
export const KEPT = TRADE - total;

const leg = {
  brokerage: buy.brokerage + sell.brokerage,
  dp: buy.dpCharge + sell.dpCharge,
  stt: buy.stt + sell.stt,
  exchange: buy.exchangeTxn + sell.exchangeTxn,
  sebi: buy.sebiFee + sell.sebiFee,
  stamp: buy.stampDuty + sell.stampDuty,
  gst: buy.gst + sell.gst,
};

/** One physical cut from the note per beat. `rest` bundles the four small ones. */
export const CUTS = [
  { id: "brokerage", beat: 2, amount: leg.brokerage },
  { id: "dp", beat: 3, amount: leg.dp },
  { id: "stt", beat: 4, amount: leg.stt },
  { id: "rest", beat: 5, amount: leg.exchange + leg.sebi + leg.stamp + leg.gst },
] as const;

/** What the note is worth after each cut, for the bar and the HUD. */
export const AFTER_CUT = CUTS.reduce<number[]>(
  (after, cut) => [...after, (after.at(-1) ?? TRADE) - cut.amount],
  [],
);

/** The receipt keeps them separate, because a pile only teaches if it is labelled. */
export const ROWS = [
  { id: "brokerage", beat: 2, amount: leg.brokerage },
  { id: "dp", beat: 3, amount: leg.dp },
  { id: "stt", beat: 4, amount: leg.stt },
  { id: "gst", beat: 5, amount: leg.gst },
  { id: "stamp", beat: 5, amount: leg.stamp },
  { id: "exchange", beat: 5, amount: leg.exchange },
  { id: "sebi", beat: 5, amount: leg.sebi },
] as const;

/** The largest row sets the receipt's zoomed scale. */
export const RECEIPT_MAX = Math.max(...ROWS.map((r) => r.amount));

/** Settled HUD value at each beat. */
export const BEAT_MONEY = [WALLET, TRADE, ...AFTER_CUT, KEPT];

export const BEAT_NOTE: HudNote[] = [
  "hudFresh",
  "hudOfWallet",
  "hudOfWallet",
  "hudOfWallet",
  "hudOfWallet",
  "hudOfWallet",
  "hudUnmoved",
];

/** Figures for the copy, formatted once. */
export const VALUES: Record<string, string> = {
  wallet: formatRupees(WALLET),
  trade: formatRupees(TRADE),
  qty: String(QTY),
  price: formatRupees(PRICE),
  brokerage: formatCost(leg.brokerage),
  brokerageLeg: formatRupees(buy.brokerage),
  dp: formatCost(leg.dp),
  dpPct: ((leg.dp / TRADE) * 100).toFixed(2),
  stt: formatCost(leg.stt),
  sttLeg: formatRupees(buy.stt),
  exchange: formatCost(leg.exchange),
  sebi: formatCost(leg.sebi),
  stamp: formatCost(leg.stamp),
  gst: formatCost(leg.gst),
  rest: formatCost(CUTS[3].amount),
  total: formatCost(TOTAL_COST),
  kept: formatCost(KEPT),
  lostPct: ((TOTAL_COST / TRADE) * 100).toFixed(2),
};
