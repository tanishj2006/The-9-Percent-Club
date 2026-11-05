import { breakevenMove, roundTripCost, GROWW } from "@/lib/costs";
import { formatCost, formatRupees, type HudNote } from "@/lib/hud-store";

/**
 * Every figure in Chapter 05 comes from costs.ts. No GSAP here; the server page
 * and the placeholder import this file too.
 */

export const BEATS = 10;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const WALLET = 2000;
export const TEN = 10;

/** One round trip at a capital. Charges depend on turnover, not share count. */
export function capitalStats(capital: number) {
  const { total } = roundTripCost(1, capital, capital);
  return {
    capital,
    cost: total,
    gapPct: breakevenMove(1, capital) * 100,
    dp: GROWW.dpChargePerSell,
    dpSharePct: (GROWW.dpChargePerSell / total) * 100,
  };
}

/** ₹500 and ₹1,000 sit below the fixture's table; costs.test.ts pins them to costs.py. */
export const TIERS = [500, 1000, 2000, 5000, 10000, 50000] as const;

/** The beat each tier's bar arrives on. */
export const TIER_BEAT: Record<(typeof TIERS)[number], number> = {
  500: 1,
  1000: 2,
  2000: 3,
  5000: 6,
  10000: 7,
  50000: 8,
};

export const WALL_BEAT = 4;
export const TEN_TRIPS_BEAT = 5;
export const SLIDER_BEAT = 9;

export const tierAtBeat = (beat: number) =>
  TIERS.filter((tier) => TIER_BEAT[tier] <= beat).at(-1) ?? null;

const you = capitalStats(WALLET);

export const TEN_TRIPS_COST = you.cost * TEN;
export const AFTER_TEN_TRIPS = WALLET - TEN_TRIPS_COST;

export const noteAtBeat = (beat: number): HudNote =>
  beat >= TEN_TRIPS_BEAT ? "hudTenTrips" : "hudFresh";

/** The slider's stops: every round number a reader is likely to try. */
export const SLIDER_STOPS = [
  ...range(500, 2000, 100),
  ...range(2500, 10000, 500),
  ...range(11000, 50000, 1000),
  ...range(55000, 100000, 5000),
];

function range(from: number, to: number, step: number) {
  const out: number[] = [];
  for (let n = from; n <= to; n += step) out.push(n);
  return out;
}

export const formatGap = (pct: number) => pct.toFixed(2);

const tierValues = Object.fromEntries(
  TIERS.flatMap((tier) => {
    const s = capitalStats(tier);
    return [
      [`c${tier}`, formatRupees(tier)],
      [`cost${tier}`, formatCost(s.cost)],
      [`pct${tier}`, formatGap(s.gapPct)],
    ];
  }),
);

export const VALUES: Record<string, string> = {
  ...tierValues,
  wallet: formatRupees(WALLET),
  dp: formatCost(you.dp),
  dpShare: you.dpSharePct.toFixed(0),
  tenCost: formatCost(TEN_TRIPS_COST),
  tenPct: ((TEN_TRIPS_COST / WALLET) * 100).toFixed(1),
  ten: String(TEN),
};
