/**
 * Figures from SEBI's July 2025 study of individual traders in equity
 * derivatives, for FY25. A later SEBI study revised the FY25 loss; the chapter's
 * source note says so. Keep the note honest if these change.
 */

export const BEATS = 8;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const TRADERS = 100;
export const LOST = 91;
export const NET_LOSS = "₹1,05,603";

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
export const FALL_TO = 0.3; // before the middle of "91 of them lost money"

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

export const VALUES: Record<string, string> = {
  lost: String(LOST),
  kept: String(TRADERS - LOST),
  loss: NET_LOSS,
};
