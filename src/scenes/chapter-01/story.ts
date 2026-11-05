import { formatRupees, type HudNote } from "@/lib/hud-store";

export const BEATS = 7;
export const beatAt = (progress: number) =>
  Math.min(Math.floor(progress * BEATS), BEATS - 1);

export const WALLET = 2000;

/** The four stops, in the order a trade reaches them. */
export const NODES = ["phone", "broker", "exchange", "demat"] as const;
export type NodeId = (typeof NODES)[number];

/** The beat each stop lights up on. */
export const NODE_BEAT: Record<NodeId, number> = {
  phone: 1,
  broker: 2,
  exchange: 3,
  demat: 4,
};

/** The HUD says where the money is, because the number itself does not move. */
export const BEAT_NOTE: HudNote[] = [
  "hudFresh",
  "hudAtBank",
  "hudAtBroker",
  "hudAtExchange",
  "hudInDemat",
  "hudInDemat",
  "hudInDemat",
];

/** Each leg finishes before the middle of its beat. */
export const LEG_TIME = 0.05;

export const VALUES: Record<string, string> = { wallet: formatRupees(WALLET) };
