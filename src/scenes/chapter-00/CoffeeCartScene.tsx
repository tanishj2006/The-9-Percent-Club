"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { hudStore, STARTING_MONEY } from "@/lib/hud-store";
import { Beat, type BeatCopy } from "./Beat";
import { GROUND, PAINT_ORDER, PARTS, SIGN_TEXT } from "./cart";
import {
  BEAT_LEAD,
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

const FADE = BEAT_LEAD;

const cups = CUPS.filter((n, i) => n > 0 && CUPS[i - 1] !== n);
const moneySteps = MONEY.flatMap((money, i) =>
  i > 0 && MONEY[i - 1] !== money ? [{ money, at: i / BEATS }] : [],
);
const CUPS_AT = { summer: 0.5, monsoon: 0.7, gone: 0.89 };

export default function CoffeeCartScene() {
  gsap.registerPlugin(useGSAP, ScrollTrigger);

  const t = useTranslations("ch00");
  const beats = t.raw("beats") as BeatCopy[];
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scene = scope.current!;
      const select = gsap.utils.selector(scene);

      const parts = PARTS.map((p) => select(`[data-part="${p.id}"]`)[0]);
      const beatEls = select("[data-testid=beat]");
      const tokens = select("[data-token]");
      const mine = YOURS.map((i) => tokens[i]);
      const cupWrap = select("[data-testid=cups]")[0];
      const cupValue = select("[data-testid=cups-value]")[0];
      const rail = select("[data-testid=rail]")[0];

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lenis = new Lenis();
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        const state = { money: STARTING_MONEY, cups: 0 };

        const sync = () => {
          const progress = tl.progress();
          cupValue.textContent = String(Math.round(state.cups));
          hudStore.set({
            money: Math.round(state.money),
            settled: MONEY[beatAt(progress)],
            owned: progress >= OWNED_AT,
          });
        };

        // Height comes from .scene in CSS and the pin from position: sticky, so
        // the trigger only measures. Lenis handles the smoothing; scrub: true
        // keeps the timeline exactly on the scroll position.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: sync,
          scrollTrigger: {
            trigger: scene,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onRefresh: () => sync(),
          },
        });

        // Spans 0..1, so every position below is a fraction of the scene.
        tl.fromTo(rail, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

        for (let i = 1; i < beatEls.length; i++) {
          const at = i / BEATS;
          tl.to(beatEls[i - 1], { autoAlpha: 0, y: -10, duration: FADE }, at - 2 * FADE);
          tl.fromTo(
            beatEls[i],
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: FADE },
            at - FADE,
          );
        }

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

        // Webfonts change the intro's height, which moves the scene's start.
        document.fonts?.ready.then(() => ScrollTrigger.refresh());

        return () => {
          gsap.ticker.remove(raf);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([...parts, ...beatEls], { autoAlpha: 1 });
        gsap.set(tokens, { attr: { "data-state": "gold" } });
        gsap.set(mine, { attr: { "data-state": "mine" } });

        const final = MONEY[MONEY.length - 1];
        ScrollTrigger.create({
          trigger: scene,
          start: "top 80%",
          end: "max",
          onToggle: ({ isActive }) =>
            hudStore.set(
              isActive
                ? { money: final, settled: final, owned: true }
                : { money: STARTING_MONEY, settled: STARTING_MONEY, owned: false },
            ),
        });
      });

      if (process.env.NODE_ENV === "development") {
        (window as unknown as Record<string, unknown>).__npc = {
          triggers: () => ScrollTrigger.getAll().length,
        };
      }

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section className="scene" ref={scope} data-testid="scene">
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
