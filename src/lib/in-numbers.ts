import {
  BOTTOM_MONEY,
  moneyAt as heldAt,
  POINTS,
  RECOVER_AT,
  START_MONEY,
  TROUGH_AT,
  LAST_AT,
} from "./drawdown";
import { formatRupees, STARTING_MONEY } from "./hud-store";
import { SEBI_STUDIES } from "./sebi-studies";
import { sipSummary } from "./sip";
import { CUPS, MONEY, TOKENS, YOURS } from "@/scenes/chapter-00/story";
import { NODES, VALUES as CH01 } from "@/scenes/chapter-01/story";
import { VALUES as CH02 } from "@/scenes/chapter-02/story";
import { CASH, QTY as QTY03, VALUES as CH03 } from "@/scenes/chapter-03/story";
import { VALUES as CH04 } from "@/scenes/chapter-04/story";
import { VALUES as CH05 } from "@/scenes/chapter-05/story";
import { VALUES as CH06 } from "@/scenes/chapter-06/curve";
import { VALUES as CH07 } from "@/scenes/chapter-07/story";
import { MONTHLY, VALUES as CH08, YEARS } from "@/scenes/chapter-08/story";

/**
 * The figures behind each chapter's server-rendered "In numbers" block. Every
 * value is derived from the code the scenes animate, and formatted with the
 * same helpers, so the text a crawler reads cannot drift from the scene.
 *
 * Server only: this pulls in the drawdown fixture. Never import it from a
 * client component or a scene.
 */

export type Locale = "en" | "hi";

/** Dates read the way the chapter copy writes them: "11 February 2020", "11 फ़रवरी 2020". */
export function formatDate(iso: string, locale: Locale, withDay = true) {
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: withDay ? "numeric" : undefined,
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/* Chapter 00: an invented cart. Each figure is worked back from the HUD path. */
const TOKEN_PRICE = STARTING_MONEY / YOURS.length;
const YOURS_PCT = (YOURS.length / TOKENS) * 100;
const PEAK = Math.max(...MONEY);
const DIP = Math.min(...MONEY.slice(MONEY.findIndex((m) => m === PEAK)));
const CH00 = {
  wallet: formatRupees(STARTING_MONEY),
  tokens: String(TOKENS),
  tokenPrice: formatRupees(TOKEN_PRICE),
  cost: formatRupees(TOKENS * TOKEN_PRICE),
  yours: String(YOURS.length),
  yoursPct: String(YOURS_PCT),
  summerCups: String(Math.max(...CUPS)),
  monsoonCups: String(Math.min(...CUPS.filter((c) => c > 0))),
  /** What the whole cart cleared, if 2% of it took ₹2,000 to the peak. */
  profit: formatRupees(((PEAK - STARTING_MONEY) * 100) / YOURS_PCT),
  peak: formatRupees(PEAK),
  dip: formatRupees(DIP),
  end: formatRupees(MONEY.at(-1)!),
};

const DAY_START = formatRupees(CASH + QTY03 * 100);

/** Every chapter's figures, keyed like the message namespaces. */
export function numbersFor(chapter: string, locale: Locale): Record<string, string> {
  switch (chapter) {
    case "ch00":
      return CH00;
    case "ch01":
      return { ...CH01, stops: String(NODES.length) };
    case "ch02":
      return CH02;
    case "ch03":
      return { ...CH03, wallet: DAY_START };
    case "ch04":
      return CH04;
    case "ch05":
      return CH05;
    case "ch06":
      return {
        ...CH06,
        peakDate: formatDate(POINTS[0].date, locale),
        troughDate: formatDate(POINTS[TROUGH_AT].date, locale),
        recoverMonth: formatDate(POINTS[RECOVER_AT].date, locale, false),
        endMonth: formatDate(POINTS[LAST_AT].date, locale, false),
      };
    case "ch07":
      return { ...CH07, keptTrading: SEBI_STUDIES.sep2024.keptTradingPct };
    case "ch08":
      return { ...CH08, years: String(YEARS) };
    default:
      throw new Error(`No figures for ${chapter}`);
  }
}

const signedPct = (n: number, digits: number) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(digits) + "%";

export type CurveRowKind = "peak" | "bottom" | "recovered" | "yearEnd" | "laterHigh" | "laterLow" | "last";

/**
 * The deepest fall after the 2020 recovery, so the table cannot read smoother
 * than the line the reader saw. On this curve it is the early-2023 fall that
 * came from basket drift; the row labels say so, as the chapter's note does.
 */
function laterFall() {
  let high = RECOVER_AT;
  let worst = { high: RECOVER_AT, low: RECOVER_AT, depth: 0 };
  for (let at = RECOVER_AT; at <= LAST_AT; at++) {
    if (heldAt(at) > heldAt(high)) high = at;
    const depth = 1 - heldAt(at) / heldAt(high);
    if (depth > worst.depth) worst = { high, low: at, depth };
  }
  return worst;
}

/**
 * Chapter 06's key points: the 2020 high, the bottom, the day it was back, the
 * last point of each year after, the later fall, and the end of the line. The
 * bottom shows paise, as the scene does; everything else is rounded to the rupee.
 */
export function curveRows(locale: Locale) {
  const atIndex = new Map<number, CurveRowKind>([
    [0, "peak"],
    [TROUGH_AT, "bottom"],
    [RECOVER_AT, "recovered"],
  ]);
  POINTS.forEach((p, i) => {
    const next = POINTS[i + 1];
    if (i > RECOVER_AT && next && next.date.slice(0, 4) !== p.date.slice(0, 4)) atIndex.set(i, "yearEnd");
  });
  const later = laterFall();
  atIndex.set(later.high, "laterHigh");
  atIndex.set(later.low, "laterLow");
  atIndex.set(LAST_AT, "last");

  return [...atIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([at, kind]) => {
      const money = at === TROUGH_AT ? BOTTOM_MONEY : heldAt(at);
      const change = ((money - START_MONEY) / START_MONEY) * 100;
      return {
        kind,
        year: POINTS[at].date.slice(0, 4),
        date: formatDate(POINTS[at].date, locale),
        value: at === TROUGH_AT ? formatRupees(BOTTOM_MONEY, true) : formatRupees(Math.round(money)),
        change: signedPct(change, at === TROUGH_AT ? 2 : 1),
        /** How far the later fall went from its own high, for that row's label. */
        depth: (later.depth * 100).toFixed(1),
      };
    });
}

/** Chapter 08's year-by-year table, with the scene's rounding. */
export function sipRows() {
  const money = (n: number) => formatRupees(Math.round(n));
  return Array.from({ length: YEARS }, (_, i) => {
    const s = sipSummary(MONTHLY, i + 1);
    return { year: String(i + 1), putIn: money(s.putIn), value: money(s.value), growth: money(s.growth) };
  });
}
