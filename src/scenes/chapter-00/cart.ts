/**
 * The isometric coffee cart. Pure geometry, no DOM.
 *
 * Axes: x runs right and down the screen, y runs left and down, z runs up. The
 * viewer looks at the +x and +y faces, so +y is the serving side of the cart.
 */

const ISO = { ox: 210, oy: 196, sx: 1.45, sy: 0.8, sz: 1.42 };

type Point = [number, number];

function iso(x: number, y: number, z: number): Point {
  return [
    ISO.ox + (x - y) * ISO.sx,
    ISO.oy + (x + y) * ISO.sy - z * ISO.sz,
  ];
}

const pts = (arr: Point[]) =>
  arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

/** The three visible faces of a box: top, left (+y), right (+x). */
function box(x: number, y: number, z: number, w: number, d: number, h: number) {
  return {
    top: pts([iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)]),
    left: pts([iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)]),
    right: pts([iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)]),
  };
}

/** A rectangle lying flat on a surface at height z. */
const flat = (z: number, x0: number, x1: number, y0: number, y1: number) =>
  pts([iso(x0, y0, z), iso(x1, y0, z), iso(x1, y1, z), iso(x0, y1, z)]);

/** A rectangle drawn on a +y face. */
const onFront = (y: number, x0: number, x1: number, z0: number, z1: number) =>
  pts([iso(x0, y, z1), iso(x1, y, z1), iso(x1, y, z0), iso(x0, y, z0)]);

/** A circle standing on a +y face. */
function disc(cx: number, y: number, cz: number, r: number) {
  const points: Point[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    points.push(iso(cx + r * Math.cos(a), y, cz + r * Math.sin(a)));
  }
  return pts(points);
}

export interface Shape {
  points: string;
  fill: string;
}

type Palette = { top: string; left: string; right: string };

const PAPER: Palette = { top: "var(--wash-gold)", left: "var(--bg-raise)", right: "var(--bg)" };
const STEEL: Palette = { top: "var(--bg-raise)", left: "var(--rule)", right: "var(--ink-faint)" };
const DARK: Palette = { top: "var(--ink-soft)", left: "var(--ink)", right: "var(--ink)" };
const GOLD: Palette = { top: "var(--marigold)", left: "var(--marigold)", right: "var(--marigold-d)" };

function solid(b: ReturnType<typeof box>, palette: Palette = PAPER): Shape[] {
  return [
    { points: b.top, fill: palette.top },
    { points: b.left, fill: palette.left },
    { points: b.right, fill: palette.right },
  ];
}

function wheel(cx: number): Shape[] {
  const r = 11;
  return [
    { points: disc(cx, 16, 11, r), fill: "var(--ink)" },
    { points: disc(cx, 20, 11, r), fill: "var(--bg-raise)" },
    { points: disc(cx, 20, 11, r * 0.42), fill: "var(--marigold)" },
  ];
}

/** Striped canopy on top, with a scalloped edge along the serving side. */
function awning(): Shape[] {
  const x0 = -46, x1 = 44, y0 = -26, y1 = 30, z = 104, h = 4;
  const shapes = solid(box(x0, y0, z, x1 - x0, y1 - y0, h), GOLD);
  const stripes = 6;
  const step = (x1 - x0) / stripes;
  for (let i = 0; i < stripes; i += 2) {
    const a = x0 + i * step;
    shapes.push({ points: flat(z + h, a, a + step, y0, y1), fill: "var(--wash-gold)" });
    shapes.push({ points: onFront(y1, a, a + step, z, z + h), fill: "var(--wash-gold)" });
  }
  for (let i = 0; i < stripes; i++) {
    const a = x0 + i * step;
    shapes.push({
      points: pts([iso(a, y1, z), iso(a + step, y1, z), iso(a + step / 2, y1, z - 6)]),
      fill: i % 2 === 0 ? "var(--wash-gold)" : "var(--marigold)",
    });
  }
  return shapes;
}

export interface Part {
  id: string;
  shapes: Shape[];
}

/** Build order: this is the order they appear as the reader scrolls. */
export const PARTS: Part[] = [
  { id: "wheelA", shapes: wheel(-22) },
  { id: "wheelB", shapes: wheel(22) },
  {
    id: "body",
    shapes: [
      ...solid(box(-38, -16, 10, 74, 34, 30)),
      { points: onFront(18, -38, 36, 24, 28), fill: "var(--marigold)" },
    ],
  },
  { id: "counter", shapes: solid(box(-42, -20, 40, 82, 42, 5), STEEL) },
  {
    id: "machine",
    shapes: [
      ...solid(box(-30, -12, 45, 26, 20, 22), STEEL),
      { points: onFront(8, -26, -8, 50, 55), fill: "var(--bg)" },
      ...solid(box(-19, 8, 53, 4, 4, 4), DARK),
      ...solid(box(-30, -12, 67, 26, 20, 2), DARK),
    ],
  },
  {
    id: "blender",
    shapes: [
      ...solid(box(6, -8, 45, 13, 13, 7), DARK),
      ...solid(box(8, -6, 52, 9, 9, 15), { top: "var(--wash-teal)", left: "var(--wash-teal)", right: "var(--wash-gold)" }),
      ...solid(box(7.5, -6.5, 67, 10, 10, 2), DARK),
    ],
  },
  {
    // Left posts. Paint before the machine; they sit clear of it on screen.
    id: "postA",
    shapes: [
      ...solid(box(-40, -18, 45, 3, 3, 59), STEEL),
      ...solid(box(-40, 17, 45, 3, 3, 59), STEEL),
    ],
  },
  {
    // Right posts. Paint after the blender; the front one passes in front of it.
    id: "postB",
    shapes: [
      ...solid(box(35, -18, 45, 3, 3, 59), STEEL),
      ...solid(box(35, 17, 45, 3, 3, 59), STEEL),
    ],
  },
  { id: "roof", shapes: awning() },
  { id: "sign", shapes: solid(box(-27, 27, 86, 56, 2, 18), { top: "var(--ink)", left: "var(--ink)", right: "var(--ink-soft)" }) },
];

/** Back to front. Separate from build order so nothing paints over its neighbour. */
export const PAINT_ORDER = [
  "body",
  "wheelA",
  "wheelB",
  "counter",
  "postA",
  "machine",
  "blender",
  "postB",
  "sign",
  "roof",
];

/** Maps text onto the sign's face, so it shears with the cart. */
export const SIGN_TEXT = (() => {
  const scale = 0.26;
  const [e, f] = iso(1, 29, 89);
  const m = [ISO.sx * scale, ISO.sy * scale, 0, ISO.sz * scale, e, f];
  return { transform: `matrix(${m.map((n) => n.toFixed(3)).join(" ")})` };
})();

/** The cart's footprint on the pavement. */
export const GROUND = flat(0, -50, 46, -30, 32);
