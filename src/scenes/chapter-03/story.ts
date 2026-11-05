import { formatRupees, type HudNote } from "@/lib/hud-store";

/** Invented prices throughout: a teaching day, with no real share behind it. */

export const BEATS = 7;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const CASH = 1000;
export const QTY = 10;

/** Price every 15 minutes, 9:15 to 3:30. */
export const DAY = [
  100, 99.2, 98.6, 97.4, 96.6, 96, 96.8, 97.9, 98.4, 99.1, 98.8, 99.6, 100.7, 101.6, 102.9,
  104.1, 105.2, 106, 105.1, 104.4, 104.8, 103.9, 103.6, 103.2, 103.4, 103,
];

export const LOW_AT = DAY.indexOf(96);
export const HIGH_AT = DAY.indexOf(106);
export const CLOSE_AT = DAY.length - 1;

export const OPEN_BEAT = 0;
export const LOW_BEAT = 1;
export const HIGH_BEAT = 2;
export const CLOSE_BEAT = 3;
export const RED_BEAT = 4;
export const ROW_BEAT = 5;

/** Each stretch of the day finishes before the middle of its beat. */
export const STRETCH_TIME = 0.06;

export function priceAt(at: number) {
  const clamped = Math.min(Math.max(at, 0), CLOSE_AT);
  const i = Math.floor(clamped);
  if (i === CLOSE_AT) return DAY[i];
  return DAY[i] + (DAY[i + 1] - DAY[i]) * (clamped - i);
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

/** The candle so far: it is only ever a summary of the line up to now. */
export function candleAt(at: number): Candle {
  const seen = [...DAY.slice(0, Math.floor(at) + 1), priceAt(at)];
  return {
    open: DAY[0],
    high: Math.max(...seen),
    low: Math.min(...seen),
    close: priceAt(at),
  };
}

export const YOUR_DAY: Candle = candleAt(CLOSE_AT);
export const RED_DAY: Candle = { open: 100, high: 101, low: 95, close: 97 };

/** Twenty invented days, each opening where the last closed, ending on yours. */
export const CANDLES: Candle[] = (() => {
  let seed = 41;
  const roll = () => {
    seed = (seed * 137 + 11) % 1000;
    return seed / 1000;
  };

  const days: Candle[] = [];
  let open = 93;
  for (let i = 0; i < 19; i++) {
    // The last invented day closes at ₹100, so your day opens where it should.
    const close = i === 18 ? YOUR_DAY.open : Math.round((open + (roll() - 0.45) * 5) * 2) / 2;
    days.push({
      open,
      close,
      high: Math.max(open, close) + 0.5 + Math.round(roll() * 4) / 2,
      low: Math.min(open, close) - 0.5 - Math.round(roll() * 4) / 2,
    });
    open = close;
  }
  return [...days, YOUR_DAY];
})();

export const moneyAt = (price: number) => CASH + QTY * price;

export const NOTE: HudNote = "hudSharesAt";

export const formatPrice = (n: number) => {
  const rounded = Math.round(n * 10) / 10;
  return "₹" + (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2));
};

export const VALUES: Record<string, string> = {
  open: formatPrice(YOUR_DAY.open),
  low: formatPrice(YOUR_DAY.low),
  high: formatPrice(YOUR_DAY.high),
  close: formatPrice(YOUR_DAY.close),
  qty: String(QTY),
  lowMoney: formatRupees(moneyAt(YOUR_DAY.low)),
  highMoney: formatRupees(moneyAt(YOUR_DAY.high)),
  closeMoney: formatRupees(moneyAt(YOUR_DAY.close)),
  redOpen: formatPrice(RED_DAY.open),
  redClose: formatPrice(RED_DAY.close),
  days: String(CANDLES.length),
};
