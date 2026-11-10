import fs from "node:fs";
import path from "node:path";
import * as hb from "harfbuzzjs";

/**
 * Text for the share cards, drawn as outlines.
 *
 * next/og's Satori does not shape Devanagari: "दिखता" comes out as "दखिता", and
 * conjuncts show a raw halant. So HarfBuzz, the shaper browsers use, turns text
 * into glyph outlines and Satori only places a finished image. Server only.
 */

const FILES = {
  display: "InstrumentSerif-Regular.ttf",
  strong: "Mukta-Bold.ttf",
  body: "Mukta-Medium.ttf",
} as const;

export type OgFont = keyof typeof FILES;

const fonts = new Map<OgFont, { font: hb.Font; upem: number }>();

function load(name: OgFont) {
  let loaded = fonts.get(name);
  if (!loaded) {
    const file = fs.readFileSync(path.join(process.cwd(), "src/assets/fonts", FILES[name]));
    const bytes = new Uint8Array(file).buffer;
    const face = new hb.Face(new hb.Blob(bytes));
    loaded = { font: new hb.Font(face), upem: face.upem };
    fonts.set(name, loaded);
  }
  return loaded;
}

export interface Glyph {
  id: number;
  x: number;
  y: number;
  d: string;
}

/**
 * Shapes one word. Words go one at a time because HarfBuzz picks shaping rules
 * from the first letters it sees: "Chart पढ़ना" as a whole would be treated as
 * Latin, and its Devanagari would come out wrong.
 */
export function shapeWord(name: OgFont, word: string): { glyphs: Glyph[]; width: number } {
  const { font } = load(name);
  const buffer = new hb.Buffer();
  buffer.addText(word);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);

  const positions = buffer.getGlyphPositions();
  let x = 0;
  const glyphs = buffer.getGlyphInfos().map((info, i) => {
    const p = positions[i];
    const glyph = {
      id: info.codepoint,
      x: x + p.xOffset,
      y: p.yOffset,
      d: font.glyphToPath(info.codepoint),
    };
    x += p.xAdvance;
    return glyph;
  });
  return { glyphs, width: x };
}

/** Instrument Serif has no rupee sign. A browser falls back on its own; this must too. */
const FALLBACK: Partial<Record<OgFont, OgFont>> = { display: "strong" };

export interface Piece {
  font: OgFont;
  glyphs: Glyph[];
  /** Width in the font's own units. */
  width: number;
}

/** Shapes a word, handing any character the font lacks to its fallback. */
export function shapePieces(name: OgFont, word: string): Piece[] {
  const whole = shapeWord(name, word);
  const fallback = FALLBACK[name];
  if (!fallback || whole.glyphs.every((glyph) => glyph.id !== 0)) {
    return [{ font: name, ...whole }];
  }

  const pieces: Piece[] = [];
  let run = "";
  const flush = () => {
    if (run) pieces.push({ font: name, ...shapeWord(name, run) });
    run = "";
  };
  for (const char of word) {
    if (shapeWord(name, char).glyphs.some((glyph) => glyph.id === 0)) {
      flush();
      pieces.push({ font: fallback, ...shapeWord(fallback, char) });
    } else {
      run += char;
    }
  }
  flush();
  return pieces;
}

export interface TextImage {
  src: string;
  width: number;
  height: number;
  lines: number;
}

/** Wraps and draws text as an SVG data URI, for an <img> inside a share card. */
export function textImage(options: {
  text: string;
  font: OgFont;
  size: number;
  color: string;
  maxWidth: number;
  lineHeight?: number;
}): TextImage {
  const { text, font: name, size, color, maxWidth, lineHeight = 1.25 } = options;
  const scaleOf = (font: OgFont) => size / load(font).upem;
  const space = shapeWord(name, " ").width * scaleOf(name);

  const lines: { pieces: Piece[]; x: number }[][] = [[]];
  let cursor = 0;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const pieces = shapePieces(name, raw);
    const width = pieces.reduce((sum, piece) => sum + piece.width * scaleOf(piece.font), 0);
    if (cursor > 0 && cursor + width > maxWidth) {
      lines.push([]);
      cursor = 0;
    }
    lines.at(-1)!.push({ pieces, x: cursor });
    cursor += width + space;
  }

  const rowHeight = size * lineHeight;
  const height = Math.ceil(rowHeight * lines.length + size * 0.3);
  const width = Math.ceil(maxWidth);

  const paths = lines.flatMap((line, row) => {
    const baseline = size + row * rowHeight;
    return line.flatMap(({ pieces, x }) => {
      let offset = x;
      return pieces.flatMap((piece) => {
        const scale = scaleOf(piece.font);
        const start = offset;
        offset += piece.width * scale;
        return piece.glyphs
          .filter((glyph) => glyph.d)
          .map(
            (glyph) =>
              `<path d="${glyph.d}" transform="translate(${(start + glyph.x * scale).toFixed(2)} ${(
                baseline -
                glyph.y * scale
              ).toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})"/>`,
          );
      });
    });
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="${color}">${paths.join("")}</svg>`;

  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    width,
    height,
    lines: lines.length,
  };
}
