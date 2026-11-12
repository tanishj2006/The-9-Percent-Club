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
import { PlumbingSceneLoader } from "@/scenes/chapter-01/PlumbingSceneLoader";
import { VALUES } from "@/scenes/chapter-01/story";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return chapterMetadata(locale, "01", VALUES);
}

export default function ChapterOne({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch01");

  return (
    <main>
      <ChapterStart note="hudFresh" />
      <ChapterIntro chapter="ch01" values={VALUES} />

      <ChapterMessages chapter="ch01">
        <PlumbingSceneLoader />
      </ChapterMessages>

      <section className="outro gutter">
        <div className="eyebrow">{t("nextUp")}</div>
        <h2 className="mb-[1.2rem]">{t("outroH")}</h2>
        <p className="max-w-[34rem] text-[1.2rem] text-ink-soft">{t("outroP", VALUES)}</p>
        <div className="handoff">
          <div className="font-display text-[1.7rem] leading-[1.2]">{t("handoffQ", VALUES)}</div>
          <p className="mt-[.8rem] text-ink-soft">{t("handoffP", VALUES)}</p>
        </div>
        <p className="mt-8 text-sm text-ink-faint">{t("assumptions")}</p>
      </section>

      <ChapterNumbers chapter="ch01" />

      <ChapterDoubts chapter="ch01" values={VALUES} />


      <ChapterNav current="01" />
    </main>
  );
}
