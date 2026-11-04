"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Beat, type BeatCopy } from "./Beat";

/**
 * Next only allows `ssr: false` inside a client component, so this thin wrapper
 * sits between the server page and the scene. It keeps GSAP and Lenis out of the
 * initial bundle, and the placeholder holds the scene's full height so the page
 * does not jump, and a restored scroll position survives, while the chunk loads.
 */
function ScenePlaceholder() {
  const t = useTranslations("ch00");
  const [first] = t.raw("beats") as BeatCopy[];

  return (
    <section className="scene">
      <div className="scene-sticky">
        <div className="stage" />
        <div className="caption gutter">
          <Beat beat={first} />
        </div>
      </div>
    </section>
  );
}

const CoffeeCartScene = dynamic(() => import("./CoffeeCartScene"), {
  ssr: false,
  loading: ScenePlaceholder,
});

export function CoffeeCartSceneLoader() {
  return <CoffeeCartScene />;
}
