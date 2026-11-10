/**
 * The grid tells the FY25 story, from SEBI's July 2025 study (PR 39/2025):
 * 91.0% of individual F&O traders lost money, net ₹1,05,603 crore.
 *
 * SEBI's August 2026 study ("Profitability of Individual Traders in the Equity
 * Derivatives Segment (FY25–FY26)") reports FY26 at 87.7%, net ₹91,685 crore,
 * and revises FY25 to 90.9% and ₹1,11,788 crore after widening its broker
 * sample from 13 to 15. The chapter says both, so 91% never reads as the latest.
 */

export const BEATS = 9;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const TRADERS = 100;
export const LOST = 91;
export const NET_LOSS = "₹1,05,603";

/** The later study, for the beat that says the picture held. */
export const FY26 = { lostPct: "87.7", netLoss: "₹91,685" };
export const FY25_REVISED = { lostPct: "90.9", netLoss: "₹1,11,788" };

/** The nine, scattered: they are not a block of people standing together. */
export const KEPT = [7, 19, 26, 42, 48, 63, 71, 85, 94];

/** A fixed shuffle, so the fall looks random but every reader sees the same one. */
export const FALL_ORDER = (() => {
  const order = Array.from({ length: TRADERS }, (_, i) => i).filter((i) => !KEPT.includes(i));
  let seed = 9;
  for (let i = order.length - 1; i > 0; i--) {
    seed = (seed * 31 + 7) % 1009;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
})();

const FALL_FROM = 1 / BEATS;
/** All 91 are down before the middle of "In FY25, 91 of them lost money". */
export const FALL_TO = 2.4 / BEATS;

/** When the nth trader goes dark. */
export const fallAt = (n: number) => FALL_FROM + (n / LOST) * (FALL_TO - FALL_FROM);

/** How many have gone dark at a progress. */
export function lostAt(progress: number) {
  const n = Math.floor(((progress - FALL_FROM) / (FALL_TO - FALL_FROM)) * LOST) + 1;
  return Math.min(Math.max(n, 0), LOST);
}

/** The nine turn teal as "9 did not" arrives. */
export const KEPT_BEAT = 3;
export const LOSS_BEAT = 6;
export const LATER_BEAT = 7;

export const VALUES: Record<string, string> = {
  lost: String(LOST),
  kept: String(TRADERS - LOST),
  loss: NET_LOSS,
  fy26Pct: FY26.lostPct,
  fy26Loss: FY26.netLoss,
  fy25RevisedPct: FY25_REVISED.lostPct,
  fy25RevisedLoss: FY25_REVISED.netLoss,
};
