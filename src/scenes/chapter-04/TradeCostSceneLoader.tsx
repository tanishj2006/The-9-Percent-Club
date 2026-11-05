"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { resolveBeats } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS, VALUES } from "./story";

function Placeholder() {
  const t = useTranslations("ch04");
  return <ScenePlaceholder beats={BEATS} first={resolveBeats(t, VALUES)[0]} />;
}

const Chapter04Scene = dynamic(() => import("./Chapter04Scene"), {
  ssr: false,
  loading: Placeholder,
});

export function TradeCostSceneLoader() {
  return <Chapter04Scene />;
}
