"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { firstBeat } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS, VALUES } from "./story";

function Placeholder() {
  const t = useTranslations("ch07");
  return <ScenePlaceholder beats={BEATS} first={firstBeat(t, VALUES)} />;
}

const Chapter07Scene = dynamic(() => import("./Chapter07Scene"), {
  ssr: false,
  loading: Placeholder,
});

export function TradersSceneLoader() {
  return <Chapter07Scene />;
}
