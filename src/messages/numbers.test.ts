import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../lib/chapters";
import { curveRows, numbersFor, sipRows, type Locale } from "../lib/in-numbers";
import { VALUES as V6 } from "../scenes/chapter-06/curve";
import { VALUES as V8 } from "../scenes/chapter-08/story";
import en from "./en.json";
import hi from "./hi.json";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
const fill = (s: string, v: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, key) => v[key] ?? `{${key}}`);

const keys = CHAPTERS.map((c) => c.titleKey);
const BUNDLES = { en, hi } as const;

/** Every "In numbers" line for a chapter, with its figures filled in. */
const lines = (locale: Locale, chapter: (typeof keys)[number]) =>
  BUNDLES[locale].numbers[chapter].map((item) => {
    const v = numbersFor(chapter, locale);
    return `${fill(item.label, v)}: ${fill(item.text, v)}`;
  });

describe("In numbers: copy", () => {
  it.each(keys)("%s has the same number of lines in English and Hindi", (key) => {
    expect(en.numbers[key].length).toBeGreaterThanOrEqual(3);
    expect(hi.numbers[key]).toHaveLength(en.numbers[key].length);
  });

  it.each(keys)("%s: every placeholder is a figure the chapter's code provides", (key) => {
    for (const locale of ["en", "hi"] as const) {
      const v = numbersFor(key, locale);
      for (const item of BUNDLES[locale].numbers[key]) {
        for (const p of [...placeholders(item.label), ...placeholders(item.text)]) {
          expect(v[p], `${locale} ${key} {${p}}`).toBeDefined();
        }
      }
    }
  });

  it("the tables' placeholders are filled too", () => {
    for (const locale of ["en", "hi"] as const) {
      const t6 = BUNDLES[locale].numbers.table06;
      for (const p of [...placeholders(t6.caption), ...placeholders(t6.change)]) {
        expect(numbersFor("ch06", locale)[p], p).toBeDefined();
      }
      for (const p of placeholders(BUNDLES[locale].numbers.table08.caption)) {
        expect(numbersFor("ch08", locale)[p], p).toBeDefined();
      }
    }
  });

  it("promises nothing and recommends nothing", () => {
    const banned =
      /guarantee|assured|sure.?shot|you will (make|earn)|join the 9%|you should (buy|invest)|\bwill (rise|grow|return)\b/i;
    for (const key of keys) for (const line of lines("en", key)) expect(line).not.toMatch(banned);
  });

  it("every illustrative or invented figure says so on its own line", () => {
    for (const line of lines("en", "ch00")) expect(line).toMatch(/invented|example/);
    for (const line of lines("en", "ch02")) expect(line).toMatch(/invented|example|On an exchange/);
    expect(lines("en", "ch03")[0]).toMatch(/invented/);
    for (const line of lines("en", "ch08")) expect(line).toMatch(/illustration|assum/i);
  });

  it("every SEBI line names its study", () => {
    for (const line of lines("en", "ch07").slice(0, 5)) expect(line).toMatch(/SEBI.*(2024|2025|2026)|(2024|2025|2026).*SEBI/);
  });
});

describe("In numbers: the figures are the scene's figures", () => {
  const has = (chapter: (typeof keys)[number], figures: string[]) => {
    for (const locale of ["en", "hi"] as const) {
      const text = lines(locale, chapter).join("\n");
      for (const f of figures) expect(text, `${locale} ${chapter} ${f}`).toContain(f);
    }
  };

  it("ch00: the cart's arithmetic, matching its beats", () => {
    has("ch00", ["₹1,00,000", "₹1,000", "2%", "₹1,20,000", "₹4,400", "₹3,150", "₹3,400"]);
    expect(en.ch00.beats[1].h).toContain(numbersFor("ch00", "en").cost);
    expect(en.ch00.beats[5].p).toContain(numbersFor("ch00", "en").profit);
  });
  it("ch02", () => has("ch02", ["₹99.50", "₹100.50", "₹1.00", "₹100"]));
  it("ch03", () => has("ch03", ["₹100", "₹96", "₹106", "₹103", "₹1,960", "₹2,060", "₹2,030"]));
  it("ch04: the fixture anchor", () => has("ch04", ["₹37.62", "₹962.38", "₹23.60", "3.76%"]));
  it("ch05: the fixture anchor", () => has("ch05", ["1.99%", "7.30%", "0.36%", "19.9%"]));
  it("ch06", () => has("ch06", ["28.02%", "42", "₹1,439.60", "136", "325%", "₹6,128", "₹1,440"]));
  it("ch07", () => has("ch07", ["91", "₹1,05,603", "87.7%", "₹91,685", "90.9%", "₹1,11,788", "75%"]));
  it("ch08", () => has("ch08", ["₹2,40,000", "₹3,99,728", "10%"]));
});

describe("In numbers: tables", () => {
  it("ch06 runs from the 2020 high, through the bottom, to the scene's last value", () => {
    const rows = curveRows("en");
    expect(rows[0]).toMatchObject({ kind: "peak", value: "₹2,000", date: "11 February 2020" });
    expect(rows.find((r) => r.kind === "bottom")).toMatchObject({
      value: V6.bottom,
      change: "−28.02%",
      date: "24 March 2020",
    });
    expect(rows.at(-1)).toMatchObject({ kind: "last", value: V6.final });
  });

  it("ch06 does not hide the later fall the line draws", () => {
    const rows = curveRows("en");
    const high = rows.find((r) => r.kind === "laterHigh")!;
    const low = rows.find((r) => r.kind === "laterLow")!;
    expect(rows.indexOf(high)).toBeLessThan(rows.indexOf(low));
    expect(Number(low.depth)).toBeGreaterThan(30);
    expect(low.date).toContain("2023");
  });

  it("ch06 dates read the way the Hindi copy writes them", () => {
    expect(curveRows("hi")[0].date).toBe(hi.ch06.crashFrom);
    expect(curveRows("hi").find((r) => r.kind === "bottom")!.date).toBe(hi.ch06.crashTo);
  });

  it("ch08 has one row a year and ends on the scene's year-10 figures", () => {
    const rows = sipRows();
    expect(rows).toHaveLength(10);
    expect(rows.at(-1)).toEqual({ year: "10", putIn: V8.put10, value: V8.value10, growth: V8.growth10 });
    for (const y of [1, 3, 5, 8]) expect(rows[y - 1].value).toBe(V8[`value${y}`]);
  });
});
