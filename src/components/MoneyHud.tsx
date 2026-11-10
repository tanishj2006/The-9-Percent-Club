"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { formatRupees, hudStore, STARTING_MONEY } from "@/lib/hud-store";

export function MoneyHud() {
  const t = useTranslations("site");
  const { money, settled, note, noteValue, label, paise } = useSyncExternalStore(
    hudStore.subscribe,
    hudStore.get,
    hudStore.getServer,
  );

  // Measured against the start, so only money-of-yours gets a colour. A trade's
  // running balance is its own thing and stays neutral.
  const tone =
    label === "hudTrade" || label === "hudSip"
      ? undefined
      : money > STARTING_MONEY
        ? "up"
        : money < STARTING_MONEY
          ? "down"
          : undefined;

  return (
    <div className="hud" data-tone={tone} data-testid="hud" data-header-item>
      <div className="hud-label" data-testid="hud-label">
        {t(label ?? "hudLabel")}
      </div>
      <div className="hud-value" data-testid="hud-value" aria-hidden="true">
        {formatRupees(money, paise)}
      </div>
      <div className="hud-sub" data-testid="hud-sub">
        {note ? t(note, { amount: noteValue ?? "" }) : ""}
      </div>
      <div className="sr-only" aria-live="polite">
        {formatRupees(settled, paise)}
      </div>
    </div>
  );
}
