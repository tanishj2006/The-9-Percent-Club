/**
 * The money HUD threads every chapter, so it lives in the layout and scenes
 * write to it from here. This module must stay free of GSAP: the HUD is in the
 * initial bundle and scenes are not.
 */

export const STARTING_MONEY = 2000;

export interface HudState {
  /** What the HUD shows. Ticks through intermediate values while animating. */
  money: number;
  /** Where the story has landed. Announced to screen readers instead of every tick. */
  settled: number;
  /** Whether the reader owns tokens yet. */
  owned: boolean;
}

const initial: HudState = {
  money: STARTING_MONEY,
  settled: STARTING_MONEY,
  owned: false,
};

let state = initial;
const listeners = new Set<() => void>();

export const hudStore = {
  get: () => state,
  getServer: () => initial,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(next: HudState) {
    if (
      next.money === state.money &&
      next.settled === state.settled &&
      next.owned === state.owned
    ) {
      return;
    }
    state = next;
    listeners.forEach((listener) => listener());
  },
};

export const formatRupees = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");
