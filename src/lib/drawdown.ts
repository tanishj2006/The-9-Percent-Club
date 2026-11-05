import data from "../../data/drawdown-2020.json";

/**
 * The real equity curve behind Chapter 06, from its 2020 peak onward.
 *
 * This imports the fixture, so only import it from a scene or a server page. The
 * fall is taught from the 2020 window. The curve also passes through a February
 * 2023 fall that came from basket drift, not the market: it is drawn because the
 * line is real, and never taught from.
 */

export const START_MONEY = 2000;

/**
 * The trough, from the file's rounded fall: 2000 × (1 − 0.2802) = ₹1,439.60, the
 * sum a reader can check. The unrounded curve gives ₹1,439.68.
 */
export const BOTTOM_MONEY = START_MONEY * (1 + data.fall_pct);

export const POINTS = data.dates.slice(data.peak_i).map((date, i) => ({
  date,
  value: data.values[data.peak_i + i],
}));

export const TROUGH_AT = data.trough_i - data.peak_i;
export const RECOVER_AT = data.recover_i - data.peak_i;
export const LAST_AT = POINTS.length - 1;

/** Rupees at a curve value. Exact at the peak and trough, proportional after. */
function moneyOf(value: number, afterTrough: boolean) {
  if (afterTrough) return BOTTOM_MONEY * (value / data.trough);
  const fell = (data.peak - value) / (data.peak - data.trough);
  return START_MONEY - fell * (START_MONEY - BOTTOM_MONEY);
}

/** Rupees at a point on the curve. `at` may fall between points while animating. */
export function moneyAt(at: number) {
  const clamped = Math.min(Math.max(at, 0), LAST_AT);
  const i = Math.floor(clamped);
  const after = i >= TROUGH_AT;
  const a = moneyOf(POINTS[i].value, after);
  if (i === LAST_AT) return a;
  const b = moneyOf(POINTS[i + 1].value, after);
  return a + (b - a) * (clamped - i);
}

export const FINAL_MONEY = moneyAt(LAST_AT);
export const FALL_DAYS = data.fall_days;
export const RECOVER_DAYS = data.recover_days;
export const FALL_PCT = -data.fall_pct * 100;
export const GAIN_FROM_BOTTOM_PCT = data.gain_from_trough * 100;
