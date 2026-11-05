/** A polyline, with how much of it is drawn when the tip is at a given point. */
export function traceLine(xy: [number, number][]) {
  const lengths = [0];
  for (let i = 1; i < xy.length; i++) {
    const [dx, dy] = [xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]];
    lengths.push(lengths[i - 1] + Math.hypot(dx, dy));
  }

  return {
    d: "M" + xy.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L"),
    /** Fraction drawn, 0..1, with the tip at point `at`, which may be fractional. */
    drawn(at: number) {
      const t = Math.min(Math.max(at, 0), xy.length - 1);
      const i = Math.min(Math.floor(t), lengths.length - 2);
      const length = lengths[i] + (lengths[i + 1] - lengths[i]) * (t - i);
      return length / lengths.at(-1)!;
    },
  };
}
