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
import { SipSceneLoader } from "@/scenes/chapter-08/SipSceneLoader";
import { VALUES } from "@/scenes/chapter-08/story";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("meta.ch08") };
}

export default function ChapterEight({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch08");

  return (
    <main>
      <ChapterStart note="hudFresh" />
      <ChapterIntro chapter="ch08" values={VALUES} />

      <ChapterMessages chapter="ch08">
        <SipSceneLoader />
      </ChapterMessages>

      <section className="outro gutter">
        <div className="eyebrow">{t("nextUp")}</div>
        <h2 className="mb-[1.2rem]">{t("outroH")}</h2>
        <p className="max-w-[34rem] text-[1.2rem] text-ink-soft">{t("outroP", VALUES)}</p>
        <p className="mt-8 text-sm text-ink-faint">{t("assumptions", VALUES)}</p>
      </section>

      <ChapterNav current="08" note="endNote" />
    </main>
  );
}
