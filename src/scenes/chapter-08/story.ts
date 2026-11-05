import { formatRupees } from "@/lib/hud-store";
import { ILLUSTRATIVE_RATE, sipSummary, sipValue } from "@/lib/sip";

export const BEATS = 7;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const MONTHLY = 2000;
export const YEARS = 10;
export const MONTHS = YEARS * 12;

/** The month the story has reached by each beat. */
export const BEAT_MONTH = [1, 12, 36, 60, 96, 120, 120];

export const FINAL = sipValue(MONTHLY, MONTHS);

export const MONTHLY_STOPS = Array.from({ length: 20 }, (_, i) => (i + 1) * 500);
export const YEAR_STOPS = Array.from({ length: 30 }, (_, i) => i + 1);

const money = (n: number) => formatRupees(Math.round(n));

const yearValues = Object.fromEntries(
  [1, 3, 5, 8, 10].flatMap((y) => {
    const s = sipSummary(MONTHLY, y);
    return [
      [`put${y}`, money(s.putIn)],
      [`value${y}`, money(s.value)],
      [`growth${y}`, money(s.growth)],
    ];
  }),
);

export const VALUES: Record<string, string> = {
  ...yearValues,
  monthly: money(MONTHLY),
  rate: String(ILLUSTRATIVE_RATE * 100),
  growthShare10: ((sipSummary(MONTHLY, 10).growth / sipValue(MONTHLY, 120)) * 100).toFixed(0),
};
