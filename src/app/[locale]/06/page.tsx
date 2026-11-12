import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { ChapterIntro } from "@/components/ChapterIntro";
import { ChapterDoubts } from "@/components/ChapterDoubts";
import { ChapterMessages } from "@/components/ChapterMessages";
import { ChapterNumbers } from "@/components/ChapterNumbers";
import { ChapterNav } from "@/components/ChapterNav";
import { ChapterStart } from "@/components/ChapterStart";
import { routing } from "@/i18n/routing";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { DrawdownSceneLoader } from "@/scenes/chapter-06/DrawdownSceneLoader";
import { VALUES } from "@/scenes/chapter-06/curve";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return chapterMetadata(locale, "06", VALUES);
}

export default function ChapterSix({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch06");

  return (
    <main>
      <ChapterStart note="hudFresh" />
      <ChapterIntro chapter="ch06" values={VALUES} />

      <ChapterMessages chapter="ch06">
        <DrawdownSceneLoader />
      </ChapterMessages>

      <section className="outro gutter">
        <div className="eyebrow">{t("nextUp")}</div>
        <h2 className="mb-[1.2rem]">{t("outroH")}</h2>
        <p className="max-w-[34rem] text-[1.2rem] text-ink-soft">{t("outroP", VALUES)}</p>
        <p className="mt-8 text-sm text-ink-faint">{t("assumptions", VALUES)}</p>
      </section>

      <ChapterNumbers chapter="ch06" />

      <ChapterDoubts chapter="ch06" values={VALUES} />


      <ChapterNav current="06" />
    </main>
  );
}
