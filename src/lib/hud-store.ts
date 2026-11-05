/**
 * The money HUD threads every chapter, so it lives in the layout and scenes
 * write to it from here. This module must stay free of GSAP: the HUD is in the
 * initial bundle and scenes are not.
 */

export const STARTING_MONEY = 2000;

/** Which `site.*` strings the HUD may show. Keys, so a language swap just works. */
export type HudLabel = "hudLabel" | "hudTrade";
export type HudNote =
  | "hudTokens"
  | "hudFresh"
  | "hudOfWallet"
  | "hudUnmoved"
  | "hudTenTrips";

export interface HudState {
  /** What the HUD shows. Ticks through intermediate values while animating. */
  money: number;
  /** Where the story has landed. Announced to screen readers instead of every tick. */
  settled: number;
  /** Line under the number explaining what it currently is. */
  note: HudNote | null;
  /** Top line. Defaults to "Your money". */
  label?: HudLabel;
  /** Show paise. Costs need them; ₹962 is not ₹962.38. */
  paise?: boolean;
}

const initial: HudState = {
  money: STARTING_MONEY,
  settled: STARTING_MONEY,
  note: null,
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
      next.note === state.note &&
      next.label === state.label &&
      next.paise === state.paise
    ) {
      return;
    }
    state = next;
    listeners.forEach((listener) => listener());
  },
};

export const formatRupees = (n: number, paise = false) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: paise ? 2 : 0,
    maximumFractionDigits: paise ? 2 : 0,
  });

/** Costs under a paisa exist (the SEBI fee on ₹1,000 is ₹0.002). Don't show ₹0.00. */
export const formatCost = (n: number) =>
  n > 0 && n < 0.01 ? `₹${n.toFixed(3)}` : formatRupees(n, true);
