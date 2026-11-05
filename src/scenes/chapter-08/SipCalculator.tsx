"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatRupees } from "@/lib/hud-store";
import { sipSummary } from "@/lib/sip";
import { MONTHLY, MONTHLY_STOPS, VALUES, YEARS, YEAR_STOPS } from "./story";

/** Survives the remount a language swap causes. */
let lastMonthly = MONTHLY_STOPS.indexOf(MONTHLY);
let lastYears = YEAR_STOPS.indexOf(YEARS);

const money = (n: number) => formatRupees(Math.round(n));

export function SipCalculator() {
  const t = useTranslations("ch08.calc");
  const [monthlyIndex, setMonthlyIndex] = useState(lastMonthly);
  const [yearsIndex, setYearsIndex] = useState(lastYears);

  const monthly = MONTHLY_STOPS[monthlyIndex];
  const years = YEAR_STOPS[yearsIndex];
  const { putIn, growth, value } = sipSummary(monthly, years);
  const yearsText = t("years", { years });

  return (
    <div className="calc calc-tight" data-testid="calc">
      <div className="calc-head">
        <label className="calc-label" htmlFor="sip-monthly">
          {t("monthly")}
        </label>
        <span className="calc-capital" data-testid="calc-monthly">
          {money(monthly)}
        </span>
      </div>
      <input
        id="sip-monthly"
        className="calc-slider"
        data-testid="calc-monthly-slider"
        type="range"
        min={0}
        max={MONTHLY_STOPS.length - 1}
        value={monthlyIndex}
        aria-valuetext={money(monthly)}
        onChange={(e) => {
          lastMonthly = e.target.valueAsNumber;
          setMonthlyIndex(lastMonthly);
        }}
      />
      <div className="calc-head">
        <label className="calc-label" htmlFor="sip-years">
          {t("horizon")}
        </label>
        <span className="calc-capital" data-testid="calc-years">
          {yearsText}
        </span>
      </div>
      <input
        id="sip-years"
        className="calc-slider"
        data-testid="calc-years-slider"
        type="range"
        min={0}
        max={YEAR_STOPS.length - 1}
        value={yearsIndex}
        aria-valuetext={yearsText}
        onChange={(e) => {
          lastYears = e.target.valueAsNumber;
          setYearsIndex(lastYears);
        }}
      />
      <dl className="calc-grid" aria-live="polite">
        <div>
          <dt>{t("putIn")}</dt>
          <dd data-testid="calc-put-in">{money(putIn)}</dd>
        </div>
        <div>
          <dt>{t("growth")}</dt>
          <dd data-testid="calc-growth">{money(growth)}</dd>
        </div>
        <div>
          <dt>{t("value")}</dt>
          <dd data-key="sip" data-testid="calc-value">
            {money(value)}
          </dd>
        </div>
      </dl>
      <p className="calc-disclaimer" data-testid="calc-disclaimer">
        {t("disclaimer", VALUES)}
      </p>
    </div>
  );
}
