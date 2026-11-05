"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { hudStore } from "@/lib/hud-store";
import { Beat, resolveBeats } from "../shared/Beat";
import { traceLine } from "../shared/trace";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import {
  beatAt,
  BEATS,
  candleAt,
  CANDLES,
  CLOSE_AT,
  CLOSE_BEAT,
  DAY,
  formatPrice,
  HIGH_AT,
  HIGH_BEAT,
  LOW_AT,
  LOW_BEAT,
  moneyAt,
  NOTE,
  priceAt,
  RED_BEAT,
  RED_DAY,
  ROW_BEAT,
  STRETCH_TIME,
  VALUES,
  type Candle,
} from "./story";

const W = 640;
const H = 300;
const LOW = 94;
const HIGH = 108;
const LINE_W = 430;
const CANDLE_X = 520;
const RED_X = 596;
const BODY_W = 42;

const py = (price: number) => H - 24 - ((price - LOW) / (HIGH - LOW)) * (H - 44);
const px = (at: number) => 8 + (at / CLOSE_AT) * (LINE_W - 16);

const LINE = traceLine(DAY.map((price, at) => [px(at), py(price)]));

const clockAt = (at: number) => {
  const minutes = 9 * 60 + 15 + Math.round(at) * 15;
  const hour = Math.floor(minutes / 60);
  return `${hour > 12 ? hour - 12 : hour}:${String(minutes % 60).padStart(2, "0")}`;
};

/** Sets a candle's four shapes. Shared by the live candle and the finished ones. */
function bodyOf(candle: Candle) {
  const top = Math.max(candle.open, candle.close);
  const bottom = Math.min(candle.open, candle.close);
  return {
    y: py(top),
    height: Math.max(py(bottom) - py(top), 2),
    up: candle.close >= candle.open,
  };
}

const ROW_W = W / CANDLES.length;
const rowLow = Math.min(...CANDLES.map((c) => c.low));
const rowHigh = Math.max(...CANDLES.map((c) => c.high));
const ry = (price: number) => H - 14 - ((price - rowLow) / (rowHigh - rowLow)) * (H - 28);

export default function Chapter03Scene() {
  const t = useTranslations("ch03");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const line = select("[data-testid=day-line]")[0];
    const tip = select("[data-testid=day-tip]")[0];
    const clock = select("[data-testid=clock]")[0];
    const wick = select("[data-testid=candle-wick]")[0];
    const body = select("[data-testid=candle-body]")[0];
    const candle = select("[data-testid=candle]")[0];
    const red = select("[data-testid=red-candle]")[0];
    const day = select("[data-testid=day-chart]")[0];
    const row = select("[data-testid=row-chart]")[0];
    const cell = (id: string) => select(`[data-testid=ohlc-${id}]`)[0];

    const state = { at: 0 };

    const show = (at: number, beat: number) => {
      const price = priceAt(at);
      const so = candleAt(at);
      const shape = bodyOf(so);

      line.setAttribute("stroke-dashoffset", String(1 - LINE.drawn(at)));
      tip.setAttribute("cx", px(at).toFixed(1));
      tip.setAttribute("cy", py(price).toFixed(1));
      clock.textContent = clockAt(at);
      clock.setAttribute("x", px(at).toFixed(1));
      clock.setAttribute("text-anchor", at < 2 ? "start" : at > CLOSE_AT - 2 ? "end" : "middle");

      wick.setAttribute("y1", py(so.high).toFixed(1));
      wick.setAttribute("y2", py(so.low).toFixed(1));
      body.setAttribute("y", shape.y.toFixed(1));
      body.setAttribute("height", shape.height.toFixed(1));
      candle.setAttribute("class", shape.up ? "candle-up" : "candle-down");

      cell("open").textContent = formatPrice(so.open);
      cell("low").textContent = beat >= LOW_BEAT ? formatPrice(so.low) : "—";
      cell("high").textContent = beat >= HIGH_BEAT ? formatPrice(so.high) : "—";
      cell("close").textContent = beat >= CLOSE_BEAT ? formatPrice(so.close) : "—";
    };

    const setHud = (at: number) =>
      hudStore.set({
        money: Math.round(moneyAt(priceAt(at))),
        settled: Math.round(moneyAt(priceAt(at))),
        note: NOTE,
        noteValue: formatPrice(priceAt(at)),
      });

    return {
      sync(progress) {
        show(state.at, beatAt(progress));
        setHud(state.at);
      },

      build(tl) {
        addBeats(tl, beatEls);

        const at = (beat: number) => beat / BEATS;

        tl.to(state, { at: LOW_AT, duration: STRETCH_TIME }, at(LOW_BEAT));
        tl.to(state, { at: HIGH_AT, duration: STRETCH_TIME }, at(HIGH_BEAT));
        tl.to(state, { at: CLOSE_AT, duration: STRETCH_TIME }, at(CLOSE_BEAT));

        tl.fromTo(red, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(RED_BEAT) - BEAT_FADE);

        tl.to(day, { autoAlpha: 0, duration: BEAT_FADE }, at(ROW_BEAT) - 2 * BEAT_FADE);
        tl.fromTo(row, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(ROW_BEAT) - BEAT_FADE);
      },

      reduced() {
        gsap.set([...beatEls, red, row], { autoAlpha: 1 });
        show(CLOSE_AT, BEATS - 1);
      },

      onReach(reached) {
        setHud(reached ? CLOSE_AT : 0);
      },
    };
  });

  const red = bodyOf(RED_DAY);

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
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("dayAlt", VALUES)} data-testid="day-chart">
                <line x1="0" x2={LINE_W} y1={py(100)} y2={py(100)} className="day-open" />
                <path
                  d={LINE.d}
                  className="day-line"
                  data-testid="day-line"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
                <circle data-testid="day-tip" r="5" fill="var(--marigold)" cx={px(0)} cy={py(100)} />
                <text x={px(0)} y={H - 4} className="curve-label" data-testid="clock">
                  9:15
                </text>

                <g data-testid="candle" className="candle-up">
                  <line data-testid="candle-wick" x1={CANDLE_X} x2={CANDLE_X} y1={py(100)} y2={py(100)} className="candle-wick" />
                  <rect data-testid="candle-body" x={CANDLE_X - BODY_W / 2} y={py(100)} width={BODY_W} height="2" />
                </g>
                <g data-testid="red-candle" className="candle-down invisible">
                  <line x1={RED_X} x2={RED_X} y1={py(RED_DAY.high)} y2={py(RED_DAY.low)} className="candle-wick" />
                  <rect x={RED_X - BODY_W / 2} y={red.y} width={BODY_W} height={red.height} />
                </g>
              </svg>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label={t("rowAlt", VALUES)}
                className="invisible"
                data-testid="row-chart"
              >
                {CANDLES.map((c, i) => {
                  const top = Math.max(c.open, c.close);
                  const bottom = Math.min(c.open, c.close);
                  const x = ROW_W * (i + 0.5);
                  const yours = i === CANDLES.length - 1;
                  return (
                    <g key={i} data-candle={i} className={c.close >= c.open ? "candle-up" : "candle-down"}>
                      <line x1={x} x2={x} y1={ry(c.high)} y2={ry(c.low)} className="candle-wick" />
                      <rect x={x - ROW_W * 0.32} y={ry(top)} width={ROW_W * 0.64} height={Math.max(ry(bottom) - ry(top), 2)} />
                      {yours && (
                        <rect
                          className="candle-last"
                          x={x - ROW_W * 0.48}
                          y={ry(c.high) - 5}
                          width={ROW_W * 0.96}
                          height={ry(c.low) - ry(c.high) + 10}
                          rx="4"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="curve-foot">
              <dl className="ohlc" data-testid="ohlc">
                {(["open", "high", "low", "close"] as const).map((id) => (
                  <div key={id}>
                    <dt>{t(`ohlc.${id}`)}</dt>
                    <dd data-testid={`ohlc-${id}`}>—</dd>
                  </div>
                ))}
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
