"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { formatCost, formatRupees, hudStore, STARTING_MONEY } from "@/lib/hud-store";
import { Beat, resolveBeats } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import {
  AFTER_CUT,
  BEAT_MONEY,
  BEAT_NOTE,
  beatAt,
  BEATS,
  CUTS,
  KEPT,
  RECEIPT_MAX,
  ROWS,
  TOTAL_COST,
  TRADE,
  VALUES,
} from "./story";

const CUT_TIME = 0.03;
/** The note's height in its 1000-unit-wide viewBox. One unit is one rupee across. */
const NOTE_H = 60;
const DROP = 30;

const paise = (n: number) => Math.round(n * 100) / 100;

export default function Chapter04Scene() {
  const t = useTranslations("ch04");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const bar = select("[data-testid=note-bar]")[0];
    const slices = CUTS.map((c) => select(`[data-slice="${c.id}"]`)[0]);
    const rows = ROWS.map((r) => select(`[data-row="${r.id}"]`)[0]);
    const totalRow = select("[data-row=total]")[0];
    const zoom = select("[data-testid=receipt-zoom]")[0];

    const state = { money: STARTING_MONEY };

    return {
      sync(progress) {
        const beat = beatAt(progress);
        const inTrade = beat >= 1;
        hudStore.set({
          money: paise(state.money),
          settled: paise(BEAT_MONEY[beat]),
          note: BEAT_NOTE[beat],
          label: inTrade ? "hudTrade" : undefined,
          paise: inTrade,
        });
      },

      build(tl) {
        addBeats(tl, beatEls);

        tl.to(state, { money: TRADE, duration: CUT_TIME }, 1 / BEATS);

        CUTS.forEach((cut, i) => {
          const at = cut.beat / BEATS;
          tl.to(state, { money: AFTER_CUT[i], duration: CUT_TIME }, at);
          tl.to(bar, { attr: { width: AFTER_CUT[i] }, duration: CUT_TIME }, at);
          tl.fromTo(
            slices[i],
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.008 },
            at,
          );
          tl.to(slices[i], { y: DROP, duration: CUT_TIME }, at + 0.008);
        });

        ROWS.forEach((row, i) => {
          const siblings = ROWS.filter((r) => r.beat === row.beat);
          tl.fromTo(
            rows[i],
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.01 },
            row.beat / BEATS + siblings.indexOf(row) * 0.012,
          );
        });

        tl.fromTo(
          zoom,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.01 },
          2 / BEATS,
        );

        const last = (BEATS - 1) / BEATS;
        tl.set(bar, { attr: { "data-state": "kept" } }, last - BEAT_FADE);
        tl.fromTo(
          totalRow,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: BEAT_FADE },
          last - BEAT_FADE,
        );
      },

      reduced() {
        gsap.set([...beatEls, ...slices, ...rows, totalRow, zoom], { autoAlpha: 1 });
        gsap.set(slices, { y: DROP });
        gsap.set(bar, { attr: { width: KEPT, "data-state": "kept" } });
      },

      onReach(reached) {
        hudStore.set(
          reached
            ? {
                money: paise(KEPT),
                settled: paise(KEPT),
                note: "hudUnmoved",
                label: "hudTrade",
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
          <div className="stage-inner stage-stack" data-fit>
            <div>
              <div className="note-head">
                <span>{t("noteLabel", VALUES)}</span>
                <span>{formatRupees(TRADE)}</span>
              </div>
              <svg
                className="note"
                viewBox={`0 0 ${TRADE} ${NOTE_H + DROP}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={t("noteAlt", VALUES)}
                data-testid="note"
              >
                <rect
                  className="note-bar"
                  data-testid="note-bar"
                  data-state="whole"
                  x="0"
                  y="0"
                  width={TRADE}
                  height={NOTE_H}
                />
                {CUTS.map((cut, i) => (
                  <rect
                    key={cut.id}
                    className="note-slice invisible"
                    data-slice={cut.id}
                    x={AFTER_CUT[i]}
                    y="0"
                    width={cut.amount}
                    height={NOTE_H}
                  />
                ))}
              </svg>
            </div>
            <div>
              <ul className="receipt" data-testid="receipt">
                {ROWS.map((row) => (
                  <li key={row.id} className="receipt-row invisible" data-row={row.id}>
                    <span>{t(`rows.${row.id}`)}</span>
                    <span>
                      <span
                        className="receipt-bar"
                        style={{ width: `${(row.amount / RECEIPT_MAX) * 100}%` }}
                      />
                    </span>
                    <span className="receipt-amount" data-testid={`amount-${row.id}`}>
                      {formatCost(row.amount)}
                    </span>
                  </li>
                ))}
                <li className="receipt-row invisible" data-row="total">
                  <span>{t("rows.total")}</span>
                  <span />
                  <span className="receipt-amount" data-testid="amount-total">
                    {formatCost(TOTAL_COST)}
                  </span>
                </li>
              </ul>
              <p className="receipt-zoom invisible" data-testid="receipt-zoom">
                {t("zoomNote")}
              </p>
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
