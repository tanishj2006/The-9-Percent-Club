"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import type { RefObject } from "react";

/**
 * The one scroll setup every chapter scene shares. The pattern is deliberate
 * and should not be swapped for `pin: true`:
 *
 *   .scene (CSS)       taller than the viewport; the scroll budget
 *   .scene-sticky      position: sticky; does the pinning
 *   ScrollTrigger      only measures progress across .scene
 *
 * Height lives in CSS, so it is reserved before the scene chunk arrives and the
 * page cannot shift when it does. If .scene has no height, span is zero, nothing
 * animates, and a screenshot still looks perfect.
 */
export interface SceneConfig {
  /** Adds tweens. Positions are fractions of the scene: the timeline spans 0..1. */
  build: (tl: gsap.core.Timeline) => void;
  /** Runs on every timeline update, with progress 0..1. Writes HUD and readouts. */
  sync: (progress: number) => void;
  /** prefers-reduced-motion: set the final state and skip the timeline. */
  reduced: () => void;
  /** Reduced motion only: the reader has reached (or left) the scene. */
  onReach: (reached: boolean) => void;
}

export function useScene(
  scope: RefObject<HTMLElement | null>,
  config: () => SceneConfig,
) {
  gsap.registerPlugin(useGSAP, ScrollTrigger);

  useGSAP(
    () => {
      const scene = scope.current!;
      const { build, sync, reduced, onReach } = config();
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // anchors: in-page links like the hero's "Start chapter 00" glide on the
        // same engine as the rest of the page, honouring scroll-margin-top.
        const lenis = new Lenis({ anchors: true });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        // Lenis handles the smoothing; scrub: true keeps the timeline exactly
        // on the scroll position.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: () => sync(tl.progress()),
          scrollTrigger: {
            trigger: scene,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onRefresh: () => sync(tl.progress()),
          },
        });

        const rail = scene.querySelector("[data-testid=rail]");
        tl.fromTo(rail, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
        build(tl);

        // Webfonts change the intro's height, which moves the scene's start.
        document.fonts?.ready.then(() => ScrollTrigger.refresh());

        return () => {
          gsap.ticker.remove(raf);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        reduced();
        ScrollTrigger.create({
          trigger: scene,
          start: "top 80%",
          end: "max",
          onToggle: ({ isActive }) => onReach(isActive),
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
}

/** Beat copy fades in this far (as a fraction of the scene) ahead of its boundary. */
export const BEAT_FADE = 0.01;

/** Hard swaps between stacked beats. Each new beat is fully in by its boundary. */
export function addBeats(
  tl: gsap.core.Timeline,
  beats: Element[],
  fade: number = BEAT_FADE,
) {
  for (let i = 1; i < beats.length; i++) {
    const at = i / beats.length;
    tl.to(beats[i - 1], { autoAlpha: 0, y: -10, duration: fade }, at - 2 * fade);
    tl.fromTo(
      beats[i],
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: fade },
      at - fade,
    );
  }
}
