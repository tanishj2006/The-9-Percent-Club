"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { hudStore, STARTING_MONEY } from "@/lib/hud-store";
import { Beat, type BeatCopy } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import { GROUND, PAINT_ORDER, PARTS, SIGN_TEXT } from "./cart";
import {
  beatAt,
  BEATS,
  CUPS,
  MONEY,
  OWNED_AT,
  partAt,
  tokenAt,
  TOKENS,
  YOURS,
} from "./story";

const CELL = 19;
const GAP = 2.6;
const PAD = 6;

const FADE = BEAT_FADE;

const cups = CUPS.filter((n, i) => n > 0 && CUPS[i - 1] !== n);
const moneySteps = MONEY.flatMap((money, i) =>
  i > 0 && MONEY[i - 1] !== money ? [{ money, at: i / BEATS }] : [],
);
const CUPS_AT = { summer: 0.5, monsoon: 0.7, gone: 0.89 };
const FINAL_MONEY = MONEY[MONEY.length - 1];

export default function CoffeeCartScene() {
  const t = useTranslations("ch00");
  const beats = t.raw("beats") as BeatCopy[];
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const parts = PARTS.map((p) => select(`[data-part="${p.id}"]`)[0]);
    const beatEls = select("[data-testid=beat]");
    const tokens = select("[data-token]");
    const mine = YOURS.map((i) => tokens[i]);
    const cupWrap = select("[data-testid=cups]")[0];
    const cupValue = select("[data-testid=cups-value]")[0];

    const state = { money: STARTING_MONEY, cups: 0 };

    return {
      sync(progress) {
        const owned = progress >= OWNED_AT;
        cupValue.textContent = String(Math.round(state.cups));
        hudStore.set({
          money: Math.round(state.money),
          settled: MONEY[beatAt(progress)],
          note: owned ? "hudTokens" : null,
        });
      },

      build(tl) {
        addBeats(tl, beatEls);

        parts.forEach((part, i) => {
          tl.fromTo(
            part,
            { autoAlpha: 0, y: -14 },
            { autoAlpha: 1, y: 0, duration: 0.012 },
            partAt(i),
          );
        });

        tokens.forEach((token, i) => {
          tl.set(token, { attr: { "data-state": "gold" } }, tokenAt(i));
        });
        tl.set(mine, { attr: { "data-state": "mine" } }, OWNED_AT);

        tl.fromTo(
          cupWrap,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: FADE },
          CUPS_AT.summer - FADE,
        );
        tl.to(state, { cups: cups[0], duration: 0.04 }, CUPS_AT.summer);
        tl.to(state, { cups: cups[1], duration: 0.04 }, CUPS_AT.monsoon);
        tl.to(cupWrap, { autoAlpha: 0, duration: FADE }, CUPS_AT.gone);

        moneySteps.forEach(({ money, at }) => {
          tl.to(state, { money, duration: 0.03 }, at);
        });
      },

      reduced() {
        gsap.set([...parts, ...beatEls], { autoAlpha: 1 });
        gsap.set(tokens, { attr: { "data-state": "gold" } });
        gsap.set(mine, { attr: { "data-state": "mine" } });
      },

      onReach(reached) {
        hudStore.set(
          reached
            ? { money: FINAL_MONEY, settled: FINAL_MONEY, note: "hudTokens" }
            : { money: STARTING_MONEY, settled: STARTING_MONEY, note: null },
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
          <div className="stage-inner">
            <div className="cart-wrap">
              <svg viewBox="70 -16 280 284" role="img" aria-labelledby="cart-title">
                <title id="cart-title">{t("cartAlt")}</title>
                <polygon points={GROUND} fill="var(--rule)" opacity="0.5" />
                {PAINT_ORDER.map((id) => {
                  const part = PARTS.find((p) => p.id === id)!;
                  return (
                    <g key={id} data-part={id} className="invisible">
                      {part.shapes.map((shape, i) => (
                        <polygon
                          key={i}
                          points={shape.points}
                          fill={shape.fill}
                          stroke="var(--ink)"
                          strokeWidth="1.1"
                          strokeLinejoin="round"
                        />
                      ))}
                      {id === "sign" && (
                        <text
                          transform={SIGN_TEXT.transform}
                          fill="var(--wash-gold)"
                          fontFamily="var(--f-mono)"
                          fontSize="20"
                          fontWeight="600"
                          textAnchor="middle"
                          x="0"
                          y="0"
                        >
                          COLD COFFEE
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              <div className="cups" data-testid="cups">
                <span className="cups-n" data-testid="cups-value">
                  0
                </span>
                <span className="cups-l">{t("cupsSold")}</span>
              </div>
            </div>
            <div className="grid-wrap">
              <svg viewBox="0 0 220 220" role="img" aria-labelledby="grid-title">
                <title id="grid-title">{t("gridAlt")}</title>
                {Array.from({ length: TOKENS }, (_, i) => (
                  <rect
                    key={i}
                    className="tok"
                    data-token={i}
                    data-state="empty"
                    x={PAD + (i % 10) * (CELL + GAP)}
                    y={PAD + Math.floor(i / 10) * (CELL + GAP)}
                    width={CELL}
                    height={CELL}
                    rx="2.5"
                  />
                ))}
              </svg>
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
