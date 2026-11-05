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
import { OrderBookSceneLoader } from "@/scenes/chapter-02/OrderBookSceneLoader";
import { VALUES } from "@/scenes/chapter-02/story";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("meta.ch02") };
}

export default function ChapterTwo({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch02");

  return (
    <main>
      <ChapterStart note="hudAtBroker" />
      <ChapterIntro chapter="ch02" values={VALUES} />

      <ChapterMessages chapter="ch02">
        <OrderBookSceneLoader />
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

      <ChapterNav current="02" />
    </main>
  );
}
