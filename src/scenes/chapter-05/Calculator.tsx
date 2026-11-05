"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatCost, formatRupees } from "@/lib/hud-store";
import { capitalStats, formatGap, SLIDER_STOPS, WALLET } from "./story";

/** Survives the remount a language swap causes, so the reader keeps their number. */
let lastIndex = SLIDER_STOPS.indexOf(WALLET);

export function Calculator() {
  const t = useTranslations("ch05.calc");
  const [index, setIndex] = useState(lastIndex);
  const stats = capitalStats(SLIDER_STOPS[index]);
  const capital = formatRupees(stats.capital);

  return (
    <div className="calc" data-testid="calc">
      <div className="calc-head">
        <label className="calc-label" htmlFor="capital">
          {t("capital")}
        </label>
        <span className="calc-capital" data-testid="calc-capital">
          {capital}
        </span>
      </div>
      <input
        id="capital"
        className="calc-slider"
        data-testid="calc-slider"
        type="range"
        min={0}
        max={SLIDER_STOPS.length - 1}
        step={1}
        value={index}
        aria-valuetext={capital}
        onChange={(e) => {
          lastIndex = e.target.valueAsNumber;
          setIndex(lastIndex);
        }}
      />
      <dl className="calc-grid" aria-live="polite">
        <div>
          <dt>{t("cost")}</dt>
          <dd data-testid="calc-cost">{formatCost(stats.cost)}</dd>
        </div>
        <div>
          <dt>{t("gap")}</dt>
          <dd data-key="gap" data-testid="calc-gap">
            {formatGap(stats.gapPct)}%
          </dd>
        </div>
        <div>
          <dt>{t("dpShare")}</dt>
          <dd data-testid="calc-dp-share">{stats.dpSharePct.toFixed(0)}%</dd>
        </div>
      </dl>
    </div>
  );
}
