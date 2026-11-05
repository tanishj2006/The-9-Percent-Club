import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { ChapterMessages } from "@/components/ChapterMessages";
import { ChapterNav } from "@/components/ChapterNav";
import { ChapterStart } from "@/components/ChapterStart";
import { routing } from "@/i18n/routing";
import { VALUES } from "@/scenes/chapter-04/story";
import { TradeCostSceneLoader } from "@/scenes/chapter-04/TradeCostSceneLoader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("meta.ch04") };
}

export default function ChapterFour({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch04");

  return (
    <main>
      <ChapterStart note="hudFresh" />
      <section className="intro gutter">
        <div className="eyebrow">{t("ch")}</div>
        <h1>{t.rich("title", { br: () => <br /> })}</h1>
        <p className="mt-[1.4rem] max-w-[30rem] text-xl text-ink-soft">
          {t("tagline", VALUES)}
        </p>
        <div className="scroll-cue">
          <span className="scroll-cue-bar" />
          <span>{t("scrollCue")}</span>
        </div>
      </section>

      <ChapterMessages chapter="ch04">
        <TradeCostSceneLoader />
      </ChapterMessages>

      <section className="outro gutter">
        <div className="eyebrow">{t("nextUp")}</div>
        <h2 className="mb-[1.2rem]">{t("outroH")}</h2>
        <p className="max-w-[34rem] text-[1.2rem] text-ink-soft">{t("outroP")}</p>
        <div className="handoff">
          <div className="font-display text-[1.7rem] leading-[1.2]">
            {t("handoffQ")}
          </div>
          <p className="mt-[.8rem] text-ink-soft">{t("handoffP", VALUES)}</p>
        </div>
        <p className="mt-8 text-sm text-ink-faint">{t("assumptions")}</p>
      </section>

      <ChapterNav current="04" />
    </main>
  );
}
