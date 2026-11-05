"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { firstBeat } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS, VALUES } from "./story";

function Placeholder() {
  const t = useTranslations("ch01");
  return <ScenePlaceholder beats={BEATS} first={firstBeat(t, VALUES)} />;
}

const Chapter01Scene = dynamic(() => import("./Chapter01Scene"), {
  ssr: false,
  loading: Placeholder,
});

export function PlumbingSceneLoader() {
  return <Chapter01Scene />;
}
