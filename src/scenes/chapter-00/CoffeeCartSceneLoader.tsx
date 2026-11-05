"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type { BeatCopy } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS } from "./story";

function Placeholder() {
  const t = useTranslations("ch00");
  const [first] = t.raw("beats") as BeatCopy[];
  return <ScenePlaceholder beats={BEATS} first={first} />;
}

// `ssr: false` is only allowed inside a client component, hence this wrapper.
// It keeps GSAP and Lenis out of the initial bundle.
const CoffeeCartScene = dynamic(() => import("./CoffeeCartScene"), {
  ssr: false,
  loading: Placeholder,
});

export function CoffeeCartSceneLoader() {
  return <CoffeeCartScene />;
}
