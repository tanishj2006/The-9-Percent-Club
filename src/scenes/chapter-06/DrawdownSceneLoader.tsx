"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { firstBeat } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS, INTRO_VALUES } from "./story";

function Placeholder() {
  const t = useTranslations("ch06");
  return <ScenePlaceholder beats={BEATS} first={firstBeat(t, INTRO_VALUES)} />;
}

const Chapter06Scene = dynamic(() => import("./Chapter06Scene"), {
  ssr: false,
  loading: Placeholder,
});

export function DrawdownSceneLoader() {
  return <Chapter06Scene />;
}
