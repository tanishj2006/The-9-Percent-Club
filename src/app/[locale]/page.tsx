import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { routing } from "@/i18n/routing";
import { CoffeeCartSceneLoader } from "@/scenes/chapter-00/CoffeeCartSceneLoader";

type Props = { params: Promise<{ locale: string }> };

export default function ChapterZero({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("ch00");

  return (
    <main>
      <section className="intro gutter">
        <div className="eyebrow">{t("ch")}</div>
        <h1>{t.rich("title", { br: () => <br /> })}</h1>
        <p className="mt-[1.4rem] max-w-[30rem] text-xl text-ink-soft">
          {t("tagline")}
        </p>
        <div className="scroll-cue">
          <span className="scroll-cue-bar" />
          <span>{t("scrollCue")}</span>
        </div>
      </section>

      <CoffeeCartSceneLoader />

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
    </main>
  );
}
