import {
  BOTTOM_MONEY,
  FALL_DAYS,
  FALL_PCT,
  FINAL_MONEY,
  GAIN_FROM_BOTTOM_PCT,
  LAST_AT,
  moneyAt,
  POINTS,
  RECOVER_DAYS,
  START_MONEY,
  TROUGH_AT,
} from "@/lib/drawdown";
import { formatRupees } from "@/lib/hud-store";
import { traceLine } from "../shared/trace";

export const W = 640;
export const H = 300;
const PAD = { left: 8, right: 8, top: 14, bottom: 14 };

interface View {
  from: number;
  to: number;
  low: number;
  high: number;
}

/**
 * 42 days are lost on a six-year axis, so the crash gets its own close-up view and
 * the aftermath zooms out. Both show the same data.
 */
export const CRASH_VIEW: View = { from: 0, to: TROUGH_AT, low: 1350, high: 2060 };
export const FULL_VIEW: View = { from: 0, to: LAST_AT, low: 0, high: 7500 };

const time = (at: number) => new Date(POINTS[at].date).getTime();

export function xOf(at: number, view: View) {
  const t = (time(at) - time(view.from)) / (time(view.to) - time(view.from));
  return PAD.left + t * (W - PAD.left - PAD.right);
}

export function yOf(money: number, view: View) {
  const t = (money - view.low) / (view.high - view.low);
  return H - PAD.bottom - t * (H - PAD.top - PAD.bottom);
}

function trace(from: number, to: number, view: View) {
  const xy: [number, number][] = [];
  for (let at = from; at <= to; at++) xy.push([xOf(at, view), yOf(moneyAt(at), view)]);
  const line = traceLine(xy);
  return { d: line.d, drawn: (at: number) => line.drawn(at - from) };
}

export const CRASH = trace(0, TROUGH_AT, CRASH_VIEW);
export const FALL_IN_FULL = trace(0, TROUGH_AT, FULL_VIEW);
export const AFTERMATH = trace(TROUGH_AT, LAST_AT, FULL_VIEW);

export const VALUES: Record<string, string> = {
  wallet: formatRupees(START_MONEY),
  bottom: formatRupees(BOTTOM_MONEY, true),
  bottomRound: formatRupees(Math.round(BOTTOM_MONEY)),
  final: formatRupees(Math.round(FINAL_MONEY)),
  fallPct: FALL_PCT.toFixed(2),
  fallDays: String(FALL_DAYS),
  recoverDays: String(RECOVER_DAYS),
  gainPct: Math.floor(GAIN_FROM_BOTTOM_PCT).toString(),
};
