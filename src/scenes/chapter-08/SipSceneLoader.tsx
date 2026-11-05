"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { firstBeat } from "../shared/Beat";
import { ScenePlaceholder } from "../shared/ScenePlaceholder";
import { BEATS, VALUES } from "./story";

function Placeholder() {
  const t = useTranslations("ch08");
  return <ScenePlaceholder beats={BEATS} first={firstBeat(t, VALUES)} />;
}

const Chapter08Scene = dynamic(() => import("./Chapter08Scene"), {
  ssr: false,
  loading: Placeholder,
});

export function SipSceneLoader() {
  return <Chapter08Scene />;
}
