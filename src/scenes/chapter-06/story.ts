import { formatRupees } from "@/lib/hud-store";

/** No data import here: the placeholder uses this file and ships in the initial bundle. */

export const BEATS = 8;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const GATE_BEAT = 3;
export const RECOVERY_BEAT = 4;
export const CLIMB_BEAT = 5;

export type Choice = "sold" | "held" | null;

export const INTRO_VALUES = { wallet: formatRupees(2000) };
