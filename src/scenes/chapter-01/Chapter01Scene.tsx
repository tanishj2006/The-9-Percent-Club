"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { hudStore, STARTING_MONEY } from "@/lib/hud-store";
import { Beat, resolveBeats } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import { BEAT_NOTE, beatAt, BEATS, LEG_TIME, NODE_BEAT, NODES, VALUES, type NodeId } from "./story";

const W = 480;
const H = 300;
const BOX = { w: 164, h: 84 };

/**
 * A loop, not a line: the money leaves you along the top and the shares come
 * back along the bottom, so the vault ends up directly under your own phone.
 */
const AT: Record<NodeId, { x: number; y: number }> = {
  phone: { x: 90, y: 62 },
  broker: { x: 390, y: 62 },
  exchange: { x: 390, y: 238 },
  demat: { x: 90, y: 238 },
};

const LEGS = [
  { id: "bank-broker", kind: "money", d: `M${AT.phone.x + BOX.w / 2} ${AT.phone.y}H${AT.broker.x - BOX.w / 2}` },
  { id: "broker-exchange", kind: "money", d: `M${AT.broker.x} ${AT.broker.y + BOX.h / 2}V${AT.exchange.y - BOX.h / 2}` },
  { id: "exchange-demat", kind: "share", d: `M${AT.exchange.x - BOX.w / 2} ${AT.exchange.y}H${AT.demat.x + BOX.w / 2}` },
];

/** Packets travel along the legs, stopping at the edge of each box. */
const STOPS = {
  bank: { x: AT.phone.x + BOX.w / 2, y: AT.phone.y },
  brokerIn: { x: AT.broker.x - BOX.w / 2, y: AT.broker.y },
  brokerOut: { x: AT.broker.x, y: AT.broker.y + BOX.h / 2 },
  exchangeIn: { x: AT.exchange.x, y: AT.exchange.y - BOX.h / 2 },
  exchangeOut: { x: AT.exchange.x - BOX.w / 2, y: AT.exchange.y },
  dematIn: { x: AT.demat.x + BOX.w / 2, y: AT.demat.y },
};

export default function Chapter01Scene() {
  const t = useTranslations("ch01");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const nodes = NODES.map((id) => select(`[data-node="${id}"]`)[0]);
    const legs = LEGS.map((leg) => select(`[data-leg-id="${leg.id}"]`)[0]);
    const money = select("[data-testid=money-packet]")[0];
    const share = select("[data-testid=share-token]")[0];

    return {
      sync(progress) {
        hudStore.set({
          money: STARTING_MONEY,
          settled: STARTING_MONEY,
          note: BEAT_NOTE[beatAt(progress)],
        });
      },

      build(tl) {
        addBeats(tl, beatEls);

        const at = (beat: number) => beat / BEATS;
        const lit = (id: NodeId, position: number) =>
          tl.set(nodes[NODES.indexOf(id)], { attr: { "data-state": "lit" } }, position);
        const draw = (i: number, position: number) =>
          tl.fromTo(
            legs[i],
            { attr: { "stroke-dashoffset": 1 } },
            { attr: { "stroke-dashoffset": 0 }, duration: LEG_TIME },
            position,
          );

        lit("phone", at(NODE_BEAT.phone) - BEAT_FADE);
        tl.fromTo(money, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(1) - BEAT_FADE);

        draw(0, at(NODE_BEAT.broker));
        tl.fromTo(money, STOPS.bank, { ...STOPS.brokerIn, duration: LEG_TIME }, at(NODE_BEAT.broker));
        lit("broker", at(NODE_BEAT.broker) + LEG_TIME);

        draw(1, at(NODE_BEAT.exchange));
        tl.fromTo(
          money,
          STOPS.brokerOut,
          { ...STOPS.exchangeIn, duration: LEG_TIME, immediateRender: false },
          at(NODE_BEAT.exchange),
        );
        lit("exchange", at(NODE_BEAT.exchange) + LEG_TIME);

        // The money stays on its way to the seller. Shares come back the other way.
        tl.to(money, { autoAlpha: 0, duration: BEAT_FADE }, at(NODE_BEAT.demat) - BEAT_FADE);
        tl.fromTo(share, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(NODE_BEAT.demat) - BEAT_FADE);
        draw(2, at(NODE_BEAT.demat));
        tl.fromTo(share, STOPS.exchangeOut, { ...STOPS.dematIn, duration: LEG_TIME }, at(NODE_BEAT.demat));
        lit("demat", at(NODE_BEAT.demat) + LEG_TIME);
      },

      reduced() {
        gsap.set(beatEls, { autoAlpha: 1 });
        gsap.set(nodes, { attr: { "data-state": "lit" } });
        gsap.set(legs, { attr: { "stroke-dashoffset": 0 } });
        gsap.set(share, { autoAlpha: 1, ...STOPS.dematIn });
      },

      onReach(reached) {
        hudStore.set({
          money: STARTING_MONEY,
          settled: STARTING_MONEY,
          note: reached ? "hudInDemat" : "hudFresh",
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
          <div className="stage-inner stage-single">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("mapAlt")} data-testid="plumbing" data-fit>
              {LEGS.map((leg) => (
                <path
                  key={leg.id}
                  d={leg.d}
                  className="plumb-leg"
                  data-leg={leg.kind}
                  data-leg-id={leg.id}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              ))}
              {NODES.map((id) => (
                <g key={id} data-node={id} data-state="dark">
                  <rect
                    className="plumb-box"
                    x={AT[id].x - BOX.w / 2}
                    y={AT[id].y - BOX.h / 2}
                    width={BOX.w}
                    height={BOX.h}
                    rx="10"
                  />
                  <text x={AT[id].x} y={AT[id].y - 2} className="plumb-title">
                    {t(`nodes.${id}.title`)}
                  </text>
                  <text x={AT[id].x} y={AT[id].y + 19} className="plumb-sub">
                    {t(`nodes.${id}.sub`)}
                  </text>
                </g>
              ))}
              <g data-testid="money-packet" className="invisible">
                <circle r="14" fill="var(--marigold)" />
                <text y="5" className="plumb-glyph">₹</text>
              </g>
              <g data-testid="share-token" className="invisible">
                <rect x="-13" y="-13" width="26" height="26" rx="5" fill="var(--teal)" />
              </g>
            </svg>
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
