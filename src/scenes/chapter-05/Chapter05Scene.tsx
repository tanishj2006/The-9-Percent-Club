"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { formatRupees, hudStore, STARTING_MONEY } from "@/lib/hud-store";
import { Beat, resolveBeats } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import { Calculator } from "./Calculator";
import {
  AFTER_TEN_TRIPS,
  beatAt,
  BEATS,
  capitalStats,
  formatGap,
  noteAtBeat,
  SLIDER_BEAT,
  TEN_TRIPS_BEAT,
  TIER_BEAT,
  tierAtBeat,
  TIERS,
  VALUES,
  WALL_BEAT,
  WALLET,
} from "./story";

const W = 480;
const H = 270;
const BASE = 232;
const SLOT = W / TIERS.length;
const BAR = 54;
const SCALE = 190 / capitalStats(TIERS[0]).gapPct; // tallest bar fills the chart

const paise = (n: number) => Math.round(n * 100) / 100;

export default function Chapter05Scene() {
  const t = useTranslations("ch05");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const tiers = TIERS.map((tier) => select(`[data-tier="${tier}"]`)[0]);
    const bars = select("[data-bars]");
    const rests = select(".gap-rest");
    const chart = select("[data-testid=chart]")[0];
    const calc = select("[data-testid=calc]")[0];
    const readoutCapital = select("[data-testid=readout-capital]")[0];
    const readoutGap = select("[data-testid=readout-gap]")[0];

    const state = { money: STARTING_MONEY };

    return {
      sync(progress) {
        const beat = beatAt(progress);
        const tier = tierAtBeat(beat);
        readoutCapital.textContent = tier ? formatRupees(tier) : "";
        readoutGap.textContent = tier ? `${formatGap(capitalStats(tier).gapPct)}%` : "";
        const spent = beat >= TEN_TRIPS_BEAT;
        hudStore.set({
          money: paise(state.money),
          settled: spent ? paise(AFTER_TEN_TRIPS) : WALLET,
          note: noteAtBeat(beat),
          paise: spent,
        });
      },

      build(tl) {
        addBeats(tl, beatEls);

        TIERS.forEach((tier, i) => {
          const at = TIER_BEAT[tier] / BEATS - BEAT_FADE;
          tl.fromTo(tiers[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at);
          tl.fromTo(
            bars[i],
            { scaleY: 0, transformOrigin: "50% 100%" },
            { scaleY: 1, duration: 0.02 },
            at,
          );
        });

        // The wall: everything but the DP charge steps back for one beat.
        tl.to(rests, { opacity: 0.2, duration: 0.02 }, WALL_BEAT / BEATS);
        tl.to(rests, { opacity: 1, duration: 0.02 }, TEN_TRIPS_BEAT / BEATS);

        tl.to(
          state,
          { money: AFTER_TEN_TRIPS, duration: 0.04 },
          TEN_TRIPS_BEAT / BEATS,
        );

        const swap = SLIDER_BEAT / BEATS;
        tl.to(chart, { autoAlpha: 0, duration: BEAT_FADE }, swap - 2 * BEAT_FADE);
        tl.fromTo(
          calc,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: BEAT_FADE },
          swap - BEAT_FADE,
        );
      },

      reduced() {
        gsap.set([...beatEls, ...tiers, calc], { autoAlpha: 1 });
        gsap.set(bars, { scaleY: 1 });
      },

      onReach(reached) {
        hudStore.set(
          reached
            ? {
                money: paise(AFTER_TEN_TRIPS),
                settled: paise(AFTER_TEN_TRIPS),
                note: "hudTenTrips",
                paise: true,
              }
            : { money: STARTING_MONEY, settled: STARTING_MONEY, note: "hudFresh" },
        );
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
              <div className="gap-chart" data-testid="chart">
                <div className="readout" data-testid="readout">
                  <span data-testid="readout-capital" />
                  <span className="readout-pct" data-testid="readout-gap" />
                </div>
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  role="img"
                  aria-label={t("chartAlt", VALUES)}
                >
                  <line x1="0" x2={W} y1={BASE} y2={BASE} stroke="var(--rule)" />
                  {TIERS.map((tier, i) => {
                    const stats = capitalStats(tier);
                    const height = stats.gapPct * SCALE;
                    const dpHeight = (stats.dp / tier) * 100 * SCALE;
                    const x = i * SLOT + (SLOT - BAR) / 2;
                    const yours = tier === WALLET;
                    return (
                      <g key={tier} data-tier={tier} className="invisible">
                        <g data-bars>
                          <rect
                            className="gap-rest"
                            data-testid={`rest-${tier}`}
                            x={x}
                            y={BASE - height}
                            width={BAR}
                            height={height - dpHeight}
                          />
                          <rect
                            className="gap-dp"
                            data-testid={`dp-${tier}`}
                            x={x}
                            y={BASE - dpHeight}
                            width={BAR}
                            height={dpHeight}
                          />
                        </g>
                        <text x={x + BAR / 2} y={BASE - height - 7} data-yours={yours}>
                          {formatGap(stats.gapPct)}%
                        </text>
                        <text x={x + BAR / 2} y={BASE + 22} data-yours={yours}>
                          {formatRupees(tier)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <Calculator />
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
