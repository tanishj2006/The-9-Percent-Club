import { describe, expect, it } from "vitest";
import { BEAT_NOTE, BEATS, LEG_TIME, NODE_BEAT, NODES, VALUES } from "./story";

describe("Chapter 01 story", () => {
  it("visits four stops in order, one per beat", () => {
    expect(NODES).toEqual(["phone", "broker", "exchange", "demat"]);
    const beats = NODES.map((n) => NODE_BEAT[n]);
    expect(beats).toEqual([1, 2, 3, 4]);
  });

  it("every beat tells the HUD where the money is", () => {
    expect(BEAT_NOTE).toHaveLength(BEATS);
    expect(BEAT_NOTE[0]).toBe("hudFresh");
    expect(BEAT_NOTE[NODE_BEAT.phone]).toBe("hudAtBank");
    expect(BEAT_NOTE[NODE_BEAT.broker]).toBe("hudAtBroker");
    expect(BEAT_NOTE[NODE_BEAT.exchange]).toBe("hudAtExchange");
    expect(BEAT_NOTE[NODE_BEAT.demat]).toBe("hudInDemat");
  });

  it("each leg finishes before the middle of its beat", () => {
    expect(LEG_TIME).toBeLessThan(0.5 / BEATS);
  });

  it("starts from the ₹2,000 wallet", () => {
    expect(VALUES.wallet).toBe("₹2,000");
  });
});
