"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { hudStore, STARTING_MONEY } from "@/lib/hud-store";
import { Beat, resolveBeats } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import {
  BEATS,
  fallAt,
  FALL_ORDER,
  KEPT,
  KEPT_BEAT,
  LOSS_BEAT,
  LOST,
  lostAt,
  NET_LOSS,
  TRADERS,
  VALUES,
} from "./story";

const CELL = 22;

export default function Chapter07Scene() {
  const t = useTranslations("ch07");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const figures = select("[data-figure]");
    const nine = KEPT.map((i) => figures[i]);
    const loss = select("[data-testid=loss-figure]")[0];
    const readout = select("[data-testid=lost-count]")[0];

    const hud = (lost: number) =>
      hudStore.set({
        money: STARTING_MONEY,
        settled: STARTING_MONEY,
        note: lost > 0 ? "hudLostCount" : "hudFresh",
        noteValue: lost > 0 ? String(lost) : undefined,
      });

    return {
      sync(progress) {
        const lost = lostAt(progress);
        readout.textContent = String(lost);
        hud(lost);
      },

      build(tl) {
        addBeats(tl, beatEls);

        FALL_ORDER.forEach((figure, n) => {
          tl.set(figures[figure], { attr: { "data-state": "lost" } }, fallAt(n));
        });

        tl.set(nine, { attr: { "data-state": "kept" } }, KEPT_BEAT / BEATS - BEAT_FADE);

        tl.fromTo(
          loss,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: BEAT_FADE },
          LOSS_BEAT / BEATS - BEAT_FADE,
        );
      },

      reduced() {
        gsap.set(beatEls, { autoAlpha: 1 });
        gsap.set(FALL_ORDER.map((i) => figures[i]), { attr: { "data-state": "lost" } });
        gsap.set(nine, { attr: { "data-state": "kept" } });
        gsap.set(loss, { autoAlpha: 1 });
        readout.textContent = String(LOST);
      },

      onReach(reached) {
        hud(reached ? LOST : 0);
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
          <div className="stage-inner stage-crowd" data-fit>
            <svg
              viewBox={`0 0 ${CELL * 10} ${CELL * 10}`}
              role="img"
              aria-label={t("gridAlt", VALUES)}
              data-testid="crowd"
            >
              {Array.from({ length: TRADERS }, (_, i) => (
                <g
                  key={i}
                  className="figure"
                  data-figure={i}
                  data-state="lit"
                  transform={`translate(${(i % 10) * CELL} ${Math.floor(i / 10) * CELL})`}
                >
                  <circle cx="11" cy="6.5" r="3.6" />
                  <path d="M4.5 19.5c0-5.4 2.6-9.2 6.5-9.2s6.5 3.8 6.5 9.2z" />
                </g>
              ))}
            </svg>
            <div className="crowd-side">
              <p className="crowd-count">
                <span data-testid="lost-count">0</span>
                <span> / {TRADERS}</span>
              </p>
              <p className="crowd-label">{t("countLabel")}</p>
              <div className="loss-figure invisible" data-testid="loss-figure">
                <span className="loss-amount">{t("lossAmount", { loss: NET_LOSS })}</span>
                <span className="loss-label">{t("lossLabel")}</span>
              </div>
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
