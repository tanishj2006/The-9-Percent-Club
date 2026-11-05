import { describe, expect, it, vi } from "vitest";
import { formatCost, formatRupees, hudStore, STARTING_MONEY } from "./hud-store";

describe("formatting", () => {
  it("groups the Indian way", () => {
    expect(formatRupees(100000)).toBe("₹1,00,000");
    expect(formatRupees(3400)).toBe("₹3,400");
  });

  it("shows paise when asked", () => {
    expect(formatRupees(962.375188, true)).toBe("₹962.38");
    expect(formatRupees(1000, true)).toBe("₹1,000.00");
  });

  it("never shows a real cost as ₹0.00", () => {
    expect(formatCost(0.002)).toBe("₹0.002");
    expect(formatCost(0.0614)).toBe("₹0.06");
    expect(formatCost(23.6)).toBe("₹23.60");
    expect(formatCost(0)).toBe("₹0.00");
  });
});

describe("hudStore", () => {
  it("only notifies on a real change", () => {
    const listener = vi.fn();
    const unsubscribe = hudStore.subscribe(listener);
    const next = { money: STARTING_MONEY + 1, settled: 1, note: null };
    hudStore.set(next);
    hudStore.set({ ...next });
    expect(listener).toHaveBeenCalledTimes(1);
    hudStore.set({ ...next, paise: true });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
