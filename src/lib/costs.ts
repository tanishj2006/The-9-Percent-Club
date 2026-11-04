/**
 * India equity transaction cost model.
 *
 * TypeScript port of nse-backtester/backtester/costs.py. Every rate is per leg
 * (a buy or a sell), and a round trip pays both legs. `data/cost-reference.json`
 * is the fixture this file must reproduce exactly; `costs.test.ts` enforces it.
 *
 * Statutory rates change with every Union Budget and exchange circular. When
 * they do, regenerate the fixture from the Python engine, then update this file.
 */

export type Side = "buy" | "sell";
export type Segment = "delivery" | "intraday";

/** Fractions of turnover, not percentages. 0.001 == 0.1%. */
export interface StatutoryRates {
  sttDelivery: number; // charged on BOTH buy and sell
  sttIntradaySell: number; // SELL side only
  exchangeTxnNse: number;
  exchangeTxnBse: number;
  sebiTurnover: number; // Rs 10 per crore
  stampDeliveryBuy: number; // BUY side only
  stampIntradayBuy: number; // BUY side only
  gstRate: number; // on brokerage + exchange txn + SEBI fee, not on STT or stamp
}

export const STATUTORY_RATES: StatutoryRates = {
  sttDelivery: 0.001,
  sttIntradaySell: 0.00025,
  exchangeTxnNse: 0.0000307,
  exchangeTxnBse: 0.0000375,
  sebiTurnover: 0.000001,
  stampDeliveryBuy: 0.00015,
  stampIntradayBuy: 0.00003,
  gstRate: 0.18,
};

/**
 * Pair with ZERO_COST for a run with genuinely no costs. ZERO_COST alone only
 * waives the broker's fees: no broker can waive STT, stamp duty and the rest.
 */
export const ZERO_RATES: StatutoryRates = {
  sttDelivery: 0,
  sttIntradaySell: 0,
  exchangeTxnNse: 0,
  exchangeTxnBse: 0,
  sebiTurnover: 0,
  stampDeliveryBuy: 0,
  stampIntradayBuy: 0,
  gstRate: 0,
};

/**
 * Brokerage per executed order: fee = max(min(flat, pct * turnover), min).
 *
 * dpChargePerSell is flat, once per scrip, on the SELL side of a delivery
 * trade, GST inclusive. It does not scale with quantity, which is why it
 * destroys small capital.
 */
export interface BrokerConfig {
  name: string;
  deliveryFlat: number;
  deliveryPct: number;
  deliveryMin: number;
  intradayFlat: number;
  intradayPct: number;
  intradayMin: number;
  dpChargePerSell: number;
  exchange: "NSE" | "BSE";
}

/** Conservative reading of Groww's published charges. */
export const GROWW: BrokerConfig = {
  name: "Groww (conservative)",
  deliveryFlat: 20,
  deliveryPct: 0.001,
  deliveryMin: 5,
  intradayFlat: 20,
  intradayPct: 0.001,
  intradayMin: 5,
  dpChargePerSell: 23.6, // Rs 20 + 18% GST
  exchange: "NSE",
};

export const ZERODHA: BrokerConfig = {
  name: "Zerodha",
  deliveryFlat: 0,
  deliveryPct: 0,
  deliveryMin: 0,
  intradayFlat: 20,
  intradayPct: 0.0003,
  intradayMin: 0,
  dpChargePerSell: 15.34,
  exchange: "NSE",
};

/** A broker that charges nothing of its own. Statutory charges still apply. */
export const ZERO_COST: BrokerConfig = {
  name: "No broker fees (reference only)",
  deliveryFlat: 0,
  deliveryPct: 0,
  deliveryMin: 0,
  intradayFlat: 0,
  intradayPct: 0,
  intradayMin: 0,
  dpChargePerSell: 0,
  exchange: "NSE",
};

export interface CostBreakdown {
  turnover: number;
  brokerage: number;
  stt: number;
  exchangeTxn: number;
  sebiFee: number;
  stampDuty: number;
  gst: number;
  dpCharge: number;
  total: number;
}

export function brokerage(
  turnover: number,
  segment: Segment,
  broker: BrokerConfig = GROWW,
): number {
  const [flat, pct, floor] =
    segment === "delivery"
      ? [broker.deliveryFlat, broker.deliveryPct, broker.deliveryMin]
      : [broker.intradayFlat, broker.intradayPct, broker.intradayMin];

  if (flat === 0 && pct === 0 && floor === 0) return 0;

  // A zero flat or zero pct means "no such cap", not "free".
  const candidates = [flat, pct * turnover].filter((v) => v > 0);
  const raw = candidates.length > 0 ? Math.min(...candidates) : 0;
  return Math.max(raw, floor);
}

/** Total charges for ONE order (one buy, or one sell). */
export function legCost(
  side: Side,
  qty: number,
  price: number,
  segment: Segment = "delivery",
  broker: BrokerConfig = GROWW,
  rates: StatutoryRates = STATUTORY_RATES,
): CostBreakdown {
  if (qty < 0) {
    throw new RangeError("qty must be non-negative; use `side` to set direction");
  }

  const turnover = qty * price;
  if (turnover === 0) {
    return {
      turnover: 0,
      brokerage: 0,
      stt: 0,
      exchangeTxn: 0,
      sebiFee: 0,
      stampDuty: 0,
      gst: 0,
      dpCharge: 0,
      total: 0,
    };
  }

  const fee = brokerage(turnover, segment, broker);

  const stt =
    segment === "delivery"
      ? turnover * rates.sttDelivery
      : side === "sell"
        ? turnover * rates.sttIntradaySell
        : 0;

  const txnRate =
    broker.exchange === "NSE" ? rates.exchangeTxnNse : rates.exchangeTxnBse;
  const exchangeTxn = turnover * txnRate;

  const sebiFee = turnover * rates.sebiTurnover;

  const stampRate =
    segment === "delivery" ? rates.stampDeliveryBuy : rates.stampIntradayBuy;
  const stampDuty = side === "buy" ? turnover * stampRate : 0;

  const gst = (fee + exchangeTxn + sebiFee) * rates.gstRate;

  const dpCharge =
    side === "sell" && segment === "delivery" ? broker.dpChargePerSell : 0;

  return {
    turnover,
    brokerage: fee,
    stt,
    exchangeTxn,
    sebiFee,
    stampDuty,
    gst,
    dpCharge,
    total: fee + stt + exchangeTxn + sebiFee + stampDuty + gst + dpCharge,
  };
}

/** Costs for a complete buy-then-sell cycle. */
export function roundTripCost(
  qty: number,
  buyPrice: number,
  sellPrice: number,
  segment: Segment = "delivery",
  broker: BrokerConfig = GROWW,
  rates: StatutoryRates = STATUTORY_RATES,
): { buy: CostBreakdown; sell: CostBreakdown; total: number } {
  const buy = legCost("buy", qty, buyPrice, segment, broker, rates);
  const sell = legCost("sell", qty, sellPrice, segment, broker, rates);
  return { buy, sell, total: buy.total + sell.total };
}

/**
 * How far the price must move in your favour, as a fraction, before a round
 * trip breaks even. Holds the sell price equal to the buy price, which slightly
 * understates the true figure (sell-side charges scale with the higher exit).
 */
export function breakevenMove(
  qty: number,
  price: number,
  segment: Segment = "delivery",
  broker: BrokerConfig = GROWW,
  rates: StatutoryRates = STATUTORY_RATES,
): number {
  const capital = qty * price;
  if (capital === 0) return Infinity;
  return roundTripCost(qty, price, price, segment, broker, rates).total / capital;
}
