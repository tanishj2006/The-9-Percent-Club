"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { formatRupees, hudStore, STARTING_MONEY } from "@/lib/hud-store";

export function MoneyHud() {
  const t = useTranslations("site");
  const { money, settled, owned } = useSyncExternalStore(
    hudStore.subscribe,
    hudStore.get,
    hudStore.getServer,
  );

  const tone =
    money > STARTING_MONEY ? "up" : money < STARTING_MONEY ? "down" : undefined;

  return (
    <div className="hud" data-tone={tone} data-testid="hud">
      <div className="hud-label">{t("hudLabel")}</div>
      <div className="hud-value" data-testid="hud-value" aria-hidden="true">
        {formatRupees(money)}
      </div>
      <div className="hud-sub" data-testid="hud-sub">
        {owned ? t("hudTokens") : ""}
      </div>
      <div className="sr-only" aria-live="polite">
        {formatRupees(settled)}
      </div>
    </div>
  );
}
