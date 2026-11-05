"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, useState, type CSSProperties } from "react";
import {
  BOTTOM_MONEY,
  FINAL_MONEY,
  LAST_AT,
  moneyAt,
  RECOVER_AT,
  START_MONEY,
  TROUGH_AT,
} from "@/lib/drawdown";
import { formatRupees, hudStore } from "@/lib/hud-store";
import { Beat, resolveBeats } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import {
  AFTERMATH,
  CRASH,
  CRASH_VIEW,
  FALL_IN_FULL,
  FULL_VIEW,
  H,
  VALUES,
  W,
  xOf,
  yOf,
} from "./curve";
import {
  BEATS,
  CLIMB_BEAT,
  GATE_BEAT,
  RECOVERY_BEAT,
  type Choice,
} from "./story";

const paise = (n: number) => Math.round(n * 100) / 100;
const rupees = (n: number) => formatRupees(Math.round(n));

const SOLD_Y = yOf(BOTTOM_MONEY, FULL_VIEW);
const SOLD_X = xOf(TROUGH_AT, FULL_VIEW);

/** Survives the remount a language swap causes. */
let lastChoice: Choice = null;

export default function Chapter06Scene() {
  const t = useTranslations("ch06");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  const [choice, setChoice] = useState<Choice>(lastChoice);
  const choiceRef = useRef<Choice>(lastChoice);
  const refreshHud = useRef<() => void>(() => {});

  const choose = (next: Exclude<Choice, null>) => {
    lastChoice = next;
    choiceRef.current = next;
    setChoice(next);
    refreshHud.current();
  };

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const crashChart = select("[data-testid=crash-chart]")[0];
    const fullChart = select("[data-testid=full-chart]")[0];
    const crashLine = select("[data-testid=crash-line]")[0];
    const heldLine = select("[data-testid=held-line]")[0];
    const soldLine = select("[data-testid=sold-line]")[0];
    const gate = select("[data-testid=gate]")[0];
    const tracks = select("[data-testid=tracks]")[0];
    const heldValue = select("[data-testid=track-held]")[0];

    const state = { at: 0 };

    /** Puts the line tip at one point on the real curve. */
    const draw = (at: number) => {
      crashLine.setAttribute("stroke-dashoffset", String(1 - CRASH.drawn(at)));
      heldLine.setAttribute("stroke-dashoffset", String(1 - AFTERMATH.drawn(at)));
      soldLine.setAttribute("x2", String(Math.max(xOf(Math.floor(at), FULL_VIEW), SOLD_X)));
      heldValue.textContent = rupees(moneyAt(at));
    };

    /** The HUD follows the reader's choice, and its note shows the other track. */
    const setHud = (at: number) => {
      const held = moneyAt(at);
      const past = at > TROUGH_AT;
      const sold = past && choiceRef.current === "sold";
      const money = sold ? BOTTOM_MONEY : held;
      hudStore.set({
        money: paise(money),
        settled: paise(money),
        note: at === 0 ? "hudFresh" : !past ? null : sold ? "hudHeldAt" : "hudSoldAt",
        noteValue: !past ? undefined : rupees(sold ? held : BOTTOM_MONEY),
        paise: at > 0,
      });
    };

    let reachedAt = 0;
    refreshHud.current = () => setHud(reachedAt);

    return {
      sync() {
        reachedAt = state.at;
        draw(state.at);
        setHud(state.at);
      },

      build(tl) {
        addBeats(tl, beatEls);

        const at = (beat: number) => beat / BEATS;

        tl.to(state, { at: TROUGH_AT, duration: 0.225 }, at(1));

        tl.fromTo(gate, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(GATE_BEAT) - BEAT_FADE);
        tl.to(gate, { autoAlpha: 0, duration: BEAT_FADE }, at(RECOVERY_BEAT) - 2 * BEAT_FADE);

        tl.to(crashChart, { autoAlpha: 0, duration: BEAT_FADE }, at(RECOVERY_BEAT) - 2 * BEAT_FADE);
        tl.fromTo(fullChart, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(RECOVERY_BEAT) - BEAT_FADE);
        tl.fromTo(tracks, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(RECOVERY_BEAT) - BEAT_FADE);

        tl.to(state, { at: RECOVER_AT, duration: 0.05 }, at(RECOVERY_BEAT));
        tl.to(state, { at: LAST_AT, duration: 0.05 }, at(CLIMB_BEAT));
      },

      reduced() {
        gsap.set([...beatEls, fullChart, gate, tracks], { autoAlpha: 1 });
        draw(LAST_AT);
      },

      onReach(reached) {
        reachedAt = reached ? LAST_AT : 0;
        setHud(reachedAt);
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
          <div className="stage-inner stage-curve" data-fit>
            <div className="curve-charts">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label={t("crashAlt", VALUES)}
                data-testid="crash-chart"
              >
                <line
                  x1="0"
                  x2={W}
                  y1={yOf(START_MONEY, CRASH_VIEW)}
                  y2={yOf(START_MONEY, CRASH_VIEW)}
                  className="curve-ref"
                />
                <text x={W - 8} y={yOf(START_MONEY, CRASH_VIEW) - 8} className="curve-label" textAnchor="end">
                  {VALUES.wallet}
                </text>
                <text x="8" y={H - 6} className="curve-label">
                  {t("crashFrom")}
                </text>
                <text x={W - 8} y={H - 6} className="curve-label" textAnchor="end">
                  {t("crashTo")}
                </text>
                <path
                  d={CRASH.d}
                  className="curve-line curve-fall"
                  data-testid="crash-line"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </svg>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label={t("fullAlt", VALUES)}
                className="invisible"
                data-testid="full-chart"
              >
                <line
                  x1="0"
                  x2={W}
                  y1={yOf(START_MONEY, FULL_VIEW)}
                  y2={yOf(START_MONEY, FULL_VIEW)}
                  className="curve-ref"
                />
                <text x="8" y={H - 6} className="curve-label">
                  {t("fullFrom")}
                </text>
                <text x={W - 8} y={H - 6} className="curve-label" textAnchor="end">
                  {t("fullTo")}
                </text>
                <path d={FALL_IN_FULL.d} className="curve-line curve-fall" />
                <line
                  x1={SOLD_X}
                  x2={SOLD_X}
                  y1={SOLD_Y}
                  y2={SOLD_Y}
                  className="curve-line curve-sold"
                  data-testid="sold-line"
                  data-chosen={choice === "sold"}
                />
                <path
                  d={AFTERMATH.d}
                  className="curve-line curve-held"
                  data-testid="held-line"
                  data-chosen={choice === "held"}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </svg>
            </div>
            <div className="curve-foot">
              <div className="gate invisible" data-testid="gate">
                <button
                  type="button"
                  className="gate-button"
                  data-kind="sold"
                  data-testid="choose-sell"
                  aria-pressed={choice === "sold"}
                  onClick={() => choose("sold")}
                >
                  {t("sell", VALUES)}
                </button>
                <button
                  type="button"
                  className="gate-button"
                  data-kind="held"
                  data-testid="choose-hold"
                  aria-pressed={choice === "held"}
                  onClick={() => choose("held")}
                >
                  {t("hold")}
                </button>
              </div>
              <dl className="tracks invisible" data-testid="tracks" data-choice={choice ?? "none"}>
                <div data-kind="sold">
                  <dt>{choice === "sold" ? t("yourTrackSold") : t("trackSold")}</dt>
                  <dd data-testid="track-sold">{rupees(BOTTOM_MONEY)}</dd>
                </div>
                <div data-kind="held">
                  <dt>{choice === "held" ? t("yourTrackHeld") : t("trackHeld")}</dt>
                  <dd data-testid="track-held">{rupees(FINAL_MONEY)}</dd>
                </div>
              </dl>
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
