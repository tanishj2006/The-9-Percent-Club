"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { firstBeat } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS, VALUES } from "./story";

function Placeholder() {
  const t = useTranslations("ch03");
  return <ScenePlaceholder beats={BEATS} first={firstBeat(t, VALUES)} />;
}

const Chapter03Scene = dynamic(() => import("./Chapter03Scene"), {
  ssr: false,
  loading: Placeholder,
});

export function CandleSceneLoader() {
  return <Chapter03Scene />;
}
