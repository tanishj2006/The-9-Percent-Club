"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { firstBeat } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS, VALUES } from "./story";

function Placeholder() {
  const t = useTranslations("ch02");
  return <ScenePlaceholder beats={BEATS} first={firstBeat(t, VALUES)} />;
}

const Chapter02Scene = dynamic(() => import("./Chapter02Scene"), {
  ssr: false,
  loading: Placeholder,
});

export function OrderBookSceneLoader() {
  return <Chapter02Scene />;
}
