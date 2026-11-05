/**
 * A monthly investment growing at a steady rate, with each instalment paid at
 * the end of its month. Real returns are never steady: this rate is an
 * assumption for showing the shape of compounding, not a historical or expected
 * return.
 */

export const ILLUSTRATIVE_RATE = 0.1;

const monthlyRate = (annual: number) => (1 + annual) ** (1 / 12) - 1;

/** Value after `months` instalments. `months` may be fractional while animating. */
export function sipValue(monthly: number, months: number, annual = ILLUSTRATIVE_RATE) {
  if (annual === 0) return monthly * months;
  const r = monthlyRate(annual);
  return (monthly * ((1 + r) ** months - 1)) / r;
}

export function sipSummary(monthly: number, years: number, annual = ILLUSTRATIVE_RATE) {
  const months = years * 12;
  const value = sipValue(monthly, months, annual);
  const putIn = monthly * months;
  return { putIn, value, growth: value - putIn };
}
