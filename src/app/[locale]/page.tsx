import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { ChapterDoubts } from "@/components/ChapterDoubts";
import { ChapterIntro } from "@/components/ChapterIntro";
import { ChapterMessages } from "@/components/ChapterMessages";
import { ChapterNumbers } from "@/components/ChapterNumbers";
import { ChapterNav } from "@/components/ChapterNav";
import { ChapterStart } from "@/components/ChapterStart";
import { ChapterMap, HomeHero } from "@/components/HomeHero";
import { routing } from "@/i18n/routing";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { CoffeeCartSceneLoader } from "@/scenes/chapter-00/CoffeeCartSceneLoader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return chapterMetadata(locale, "00");
}

export default function ChapterZero({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch00");

  return (
    <main>
      <ChapterStart />
      <HomeHero />
      <ChapterMap />
      <ChapterIntro chapter="ch00" id="chapter-00" />

      <ChapterMessages chapter="ch00">
        <CoffeeCartSceneLoader />
      </ChapterMessages>

      <section className="outro gutter">
        <div className="eyebrow">{t("nextUp")}</div>
        <h2 className="mb-[1.2rem]">{t("outroH")}</h2>
        <p className="max-w-[34rem] text-[1.2rem] text-ink-soft">{t("outroP")}</p>
        <div className="handoff">
          <div className="font-display text-[1.7rem] leading-[1.2]">
            {t("handoffQ")}
          </div>
          <p className="mt-[.8rem] text-ink-soft">{t("handoffP")}</p>
        </div>
      </section>

      <ChapterNumbers chapter="ch00" />

      <ChapterDoubts chapter="ch00" />


      <ChapterNav current="00" />
    </main>
  );
}
