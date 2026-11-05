/**
 * Where everything in Chapter 00 happens, as fractions of scene progress.
 * No GSAP in here: the server-rendered placeholder imports this file too.
 */

export const BEATS = 10;

/** Which beat a scroll progress of 0..1 falls in. */
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

/**
 * Money at each beat. Stays at 2,000 until the summer, peaks, then the monsoon
 * takes some back. The monsoon beat is deliberate: see "Honesty" in CLAUDE.md.
 */
export const MONEY = [
  2000, 2000, 2000, 2000, 2000, 2000, 4400, 4400, 3150, 3400,
] as const;

/** Cups a day at each beat. 0 hides the counter. */
export const CUPS = [0, 0, 0, 0, 0, 240, 240, 30, 30, 0] as const;

/** Cart parts appear one by one, complete before any money moves. */
export const partAt = (order: number) => order * 0.048;

/** Tokens fill left to right, top to bottom, done by 42%. */
export const tokenAt = (index: number) => (index + 0.5) * 0.0042;

/** Beat copy fades in 1% ahead of its boundary; see BEAT_FADE in useScene. */
const BEAT_LEAD = 0.01;

/**
 * Your 2 tokens turn teal and the HUD says so, as "You buy 2 tokens" (beat 3,
 * at 30%) starts to fade in: the copy and the tokens have to land together.
 */
export const OWNED_AT = 0.3 - BEAT_LEAD;

/** Two adjacent tokens: 2% of 100. */
export const YOURS = [44, 45];
export const TOKENS = 100;
