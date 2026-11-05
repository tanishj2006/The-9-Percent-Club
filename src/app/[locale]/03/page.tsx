import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { ChapterIntro } from "@/components/ChapterIntro";
import { ChapterMessages } from "@/components/ChapterMessages";
import { ChapterNav } from "@/components/ChapterNav";
import { ChapterStart } from "@/components/ChapterStart";
import { routing } from "@/i18n/routing";
import { CandleSceneLoader } from "@/scenes/chapter-03/CandleSceneLoader";
import { VALUES } from "@/scenes/chapter-03/story";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("meta.ch03") };
}

export default function ChapterThree({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch03");

  return (
    <main>
      <ChapterStart note="hudSharesAt" noteValue={VALUES.open} />
      <ChapterIntro chapter="ch03" values={VALUES} />

      <ChapterMessages chapter="ch03">
        <CandleSceneLoader />
      </ChapterMessages>

      <section className="outro gutter">
        <div className="eyebrow">{t("nextUp")}</div>
        <h2 className="mb-[1.2rem]">{t("outroH")}</h2>
        <p className="max-w-[34rem] text-[1.2rem] text-ink-soft">{t("outroP", VALUES)}</p>
        <div className="handoff">
          <div className="font-display text-[1.7rem] leading-[1.2]">{t("handoffQ", VALUES)}</div>
          <p className="mt-[.8rem] text-ink-soft">{t("handoffP", VALUES)}</p>
        </div>
        <p className="mt-8 text-sm text-ink-faint">{t("assumptions", VALUES)}</p>
      </section>

      <ChapterNav current="03" />
    </main>
  );
}
