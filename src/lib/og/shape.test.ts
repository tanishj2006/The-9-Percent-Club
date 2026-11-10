import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../chapters";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import { shapePieces, shapeWord, textImage } from "./shape";

const ids = (font: Parameters<typeof shapeWord>[0], word: string) =>
  shapeWord(font, word).glyphs.map((g) => g.id);

describe("Devanagari shaping, which next/og cannot do alone", () => {
  it("draws the short i matra before its consonant", () => {
    const di = ids("strong", "दि");
    const d = ids("strong", "द")[0];
    expect(di[0], "matra first").not.toBe(d);
    expect(di[1], "consonant second").toBe(d);
  });

  it("joins conjuncts instead of showing a raw halant", () => {
    const halant = ids("strong", "्")[0];
    expect(ids("strong", "क्या")).not.toContain(halant);
    expect(ids("strong", "ज़्यादातर")).not.toContain(halant);
  });

  it("forms a reph", () => {
    expect(ids("strong", "शर्त").length).toBeLessThan([..."शर्त"].length);
  });
});

describe("no missing glyphs on any card", () => {
  const titles = CHAPTERS.flatMap(({ titleKey }) => [
    ["display", en.nav[titleKey]],
    ["strong", hi.nav[titleKey]],
    ["body", en[titleKey].ch],
    ["body", hi[titleKey].ch],
  ]) as [Parameters<typeof shapeWord>[0], string][];

  const lines = [
    ...titles,
    ["display", "The 9% Club"],
    ["body", en.site.tagline],
    ["body", hi.site.tagline],
  ] as [Parameters<typeof shapeWord>[0], string][];

  it.each(lines)("%s: %s", (font, text) => {
    for (const word of text.split(/\s+/)) {
      const glyphs = shapePieces(font, word).flatMap((piece) => piece.glyphs);
      expect(glyphs.map((g) => g.id), word).not.toContain(0);
    }
  });
});

describe("font fallback", () => {
  it("borrows the rupee sign, because Instrument Serif has none", () => {
    expect(ids("display", "₹")).toContain(0);
    const pieces = shapePieces("display", "₹2,000");
    expect(pieces.map((piece) => piece.font)).toEqual(["strong", "display"]);
  });

  it("leaves words the font can draw alone", () => {
    expect(shapePieces("display", "trade")).toHaveLength(1);
  });
});

describe("textImage", () => {
  const options = { font: "body", size: 40, color: "#fff" } as const;

  it("is an SVG data URI of the requested width", () => {
    const image = textImage({ ...options, text: "नमस्ते", maxWidth: 500 });
    expect(image.src.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(image.width).toBe(500);
    expect(Buffer.from(image.src.split(",")[1], "base64").toString()).toContain("<path");
  });

  it("wraps long text, and never loses a word", () => {
    const text = "one two three four five six seven eight nine ten";
    const wide = textImage({ ...options, text, maxWidth: 2000 });
    const narrow = textImage({ ...options, text, maxWidth: 200 });
    expect(wide.lines).toBe(1);
    expect(narrow.lines).toBeGreaterThan(1);
    expect(narrow.height).toBeGreaterThan(wide.height);
  });

  it("a mixed line shapes each word by its own script", () => {
    const halant = ids("strong", "्")[0];
    expect(ids("strong", "Chart")).not.toContain(halant);
    expect(ids("strong", "पढ़ना")).not.toContain(0);
  });
});
