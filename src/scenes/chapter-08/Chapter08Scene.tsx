"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { formatRupees, hudStore } from "@/lib/hud-store";
import { sipValue } from "@/lib/sip";
import { Beat, resolveBeats } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import { SipCalculator } from "./SipCalculator";
import { BEAT_MONTH, BEATS, beatAt, FINAL, MONTHLY, MONTHS, VALUES, YEARS } from "./story";

const W = 640;
const H = 300;
const BASE = 272;
const TOP = 12;

const x = (month: number) => (month / MONTHS) * W;
const y = (money: number) => BASE - (money / (FINAL * 1.04)) * (BASE - TOP);

const curve = (at: (month: number) => number) =>
  Array.from({ length: MONTHS + 1 }, (_, m) => `${x(m).toFixed(1)} ${y(at(m)).toFixed(1)}`);

const principal = curve((m) => MONTHLY * m);
const total = curve((m) => sipValue(MONTHLY, m));

const PRINCIPAL_AREA = `M0 ${BASE}L${principal.join("L")}L${W} ${BASE}Z`;
const GROWTH_AREA = `M${total.join("L")}L${[...principal].reverse().join("L")}Z`;

const money = (n: number) => formatRupees(Math.round(n));
const PHASE = 0.4; // of a beat: each beat's months are done by its middle

export default function Chapter08Scene() {
  const t = useTranslations("ch08");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const reveal = select("[data-testid=reveal]")[0];
    const chart = select("[data-testid=sip-chart]")[0];
    const calc = select("[data-testid=calc]")[0];
    const putValue = select("[data-testid=read-put-in]")[0];
    const totalValue = select("[data-testid=read-value]")[0];
    const yearValue = select("[data-testid=read-year]")[0];

    const state = { month: BEAT_MONTH[0] };

    const show = (month: number, settledMonth: number) => {
      reveal.setAttribute("width", x(month).toFixed(1));
      const value = sipValue(MONTHLY, month);
      const putIn = MONTHLY * month;
      putValue.textContent = money(putIn);
      totalValue.textContent = money(value);
      yearValue.textContent = (month / 12).toFixed(1);
      hudStore.set({
        money: Math.round(value),
        settled: Math.round(sipValue(MONTHLY, settledMonth)),
        label: "hudSip",
        note: "hudPutIn",
        noteValue: money(putIn),
      });
    };

    return {
      sync(progress) {
        show(state.month, BEAT_MONTH[beatAt(progress)]);
      },

      build(tl) {
        addBeats(tl, beatEls);

        BEAT_MONTH.forEach((month, beat) => {
          if (beat === 0 || month === BEAT_MONTH[beat - 1]) return;
          tl.to(state, { month, duration: PHASE / BEATS }, beat / BEATS);
        });

        const swap = (BEATS - 1) / BEATS;
        tl.to(chart, { autoAlpha: 0, duration: BEAT_FADE }, swap - 2 * BEAT_FADE);
        tl.fromTo(calc, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, swap - BEAT_FADE);
      },

      reduced() {
        gsap.set([...beatEls, chart, calc], { autoAlpha: 1 });
        reveal.setAttribute("width", String(W));
        putValue.textContent = money(MONTHLY * MONTHS);
        totalValue.textContent = money(FINAL);
        yearValue.textContent = YEARS.toFixed(1);
      },

      onReach(reached) {
        const month = reached ? MONTHS : 1;
        hudStore.set({
          money: Math.round(sipValue(MONTHLY, month)),
          settled: Math.round(sipValue(MONTHLY, month)),
          label: "hudSip",
          note: "hudPutIn",
          noteValue: money(MONTHLY * month),
        });
      },
    };
  });

  return (
    <section
      className="scene"
      ref={scope}
      data-testid="scene"
      style={{ "--beats": BEATS } as CSSProperties}
    >
      <div className="rail" data-testid="rail" />
      <div className="scene-sticky" data-testid="scene-sticky">
        <div className="stage gutter">
          <div className="stage-inner stage-gap">
            <div className="gap-stage" data-fit>
              <div className="gap-chart" data-testid="sip-chart">
                <div className="readout readout-sip">
                  <span>
                    {t("yearLabel")} <span data-testid="read-year">0.1</span>
                  </span>
                  <span className="readout-put">
                    {t("putLabel")} <span data-testid="read-put-in">{money(MONTHLY)}</span>
                  </span>
                  <span className="readout-total" data-testid="read-value">
                    {money(MONTHLY)}
                  </span>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("chartAlt", VALUES)}>
                  <defs>
                    <clipPath id="sip-reveal">
                      <rect data-testid="reveal" x="0" y="0" width="0" height={H} />
                    </clipPath>
                  </defs>
                  <line x1="0" x2={W} y1={BASE} y2={BASE} stroke="var(--rule)" />
                  <g clipPath="url(#sip-reveal)">
                    <path d={PRINCIPAL_AREA} className="sip-principal" data-testid="area-principal" />
                    <path d={GROWTH_AREA} className="sip-growth" data-testid="area-growth" />
                  </g>
                  {[1, 3, 5, 8, 10].map((year) => (
                    <text key={year} x={x(year * 12)} y={BASE + 20} className="sip-tick">
                      {year}
                    </text>
                  ))}
                </svg>
              </div>
              <SipCalculator />
            </div>
          </div>
        </div>
        <div className="caption gutter">
          {beats.map((beat, i) => (
            <Beat key={i} beat={beat} />
          ))}
        </div>
      </div>
    </section>
  );
}
