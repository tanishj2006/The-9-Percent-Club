import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { ContactLinks, InfoPage } from "@/components/InfoPage";
import { routing } from "@/i18n/routing";
import { routeMetadata } from "@/lib/chapter-metadata";
import { repoFile } from "@/lib/contact";
import { SEBI_STUDIES } from "@/lib/sebi-studies";
import { VALUES as V1 } from "@/scenes/chapter-01/story";
import { VALUES as V2 } from "@/scenes/chapter-02/story";
import { VALUES as V3 } from "@/scenes/chapter-03/story";
import { VALUES as V4 } from "@/scenes/chapter-04/story";
import { VALUES as V5 } from "@/scenes/chapter-05/story";
import { VALUES as V6 } from "@/scenes/chapter-06/curve";
import { VALUES as V7 } from "@/scenes/chapter-07/story";
import { VALUES as V8 } from "@/scenes/chapter-08/story";

type Props = { params: Promise<{ locale: string }> };

/** The chapters' own footnotes, rendered from the same keys, so the two never disagree. */
const FOOTNOTES = [
  ["ch01", V1],
  ["ch02", V2],
  ["ch03", V3],
  ["ch04", V4],
  ["ch05", V5],
  ["ch06", V6],
  ["ch07", V7],
  ["ch08", V8],
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "methodology" });
  return routeMetadata(locale, "/methodology", t("metaTitle"), t("description"));
}

export default function Methodology({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = useTranslations("methodology");
  const chapters = useTranslations();
  const sebi = SEBI_STUDIES;
  // Named one by one: the chapters' own value sets reuse names like lostPct.
  const values = {
    total: V4.total,
    fallPct: V6.fallPct,
    fallDays: V6.fallDays,
    recoverDays: V6.recoverDays,
    lost: V7.lost,
    loss: V7.loss,
    fy26Pct: V7.fy26Pct,
    fy26Loss: V7.fy26Loss,
    fy25RevisedPct: V7.fy25RevisedPct,
    fy25RevisedLoss: V7.fy25RevisedLoss,
    sep2024Lost: sebi.sep2024.lostPct,
    sep2024KeptTrading: sebi.sep2024.keptTradingPct,
    sep2024Profit: sebi.sep2024.profitPct,
  };

  return (
    <InfoPage testId="methodology">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="info-lede">{t("lede")}</p>

      <section aria-labelledby="costs">
        <h2 id="costs">{t("costsTitle")}</h2>
        <p>{t("costs", values)}</p>
        <p>{t("costsRates")}</p>
        <ul className="info-links">
          <li>
            <a href={repoFile("src/lib/costs.ts")}>{t("costsCode")}</a>
          </li>
          <li>
            <a href={repoFile("data/cost-reference.json")}>{t("costsFixture")}</a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="drawdown">
        <h2 id="drawdown">{t("drawdownTitle")}</h2>
        <p>{t("drawdown", values)}</p>
        <ul className="info-links">
          <li>
            <a href={repoFile("data/drawdown-2020.json")}>{t("drawdownData")}</a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="sebi">
        <h2 id="sebi">{t("sebiTitle")}</h2>
        <p>{t("sebiScope")}</p>
        <ul className="info-studies">
          <li>
            <p>{t("sebiJul2025", values)}</p>
            <a href={sebi.jul2025.pressRelease}>{t("pressRelease", { number: "39/2025" })}</a>
            {" · "}
            <a href={sebi.jul2025.study}>{t("fullStudy")}</a>
          </li>
          <li>
            <p>{t("sebiAug2026", values)}</p>
            <a href={sebi.aug2026.study}>{t("fullStudy")}</a>
          </li>
          <li>
            <p>{t("sebiSep2024", values)}</p>
            <a href={sebi.sep2024.pressRelease}>{t("pressRelease", { number: "22/2024" })}</a>
            {" · "}
            <a href={sebi.sep2024.study}>{t("fullStudy")}</a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="prices">
        <h2 id="prices">{t("pricesTitle")}</h2>
        <p>{t("prices")}</p>
      </section>

      <section aria-labelledby="simplifications">
        <h2 id="simplifications">{t("simplificationsTitle")}</h2>
        <p>{t("simplificationsLede")}</p>
        <dl className="info-footnotes">
          {FOOTNOTES.map(([key, v]) => {
            return (
              <div key={key} data-testid={`footnote-${key}`}>
                <dt>
                  {chapters(`${key}.ch`)} · {chapters(`nav.${key}`)}
                </dt>
                <dd>{chapters(`${key}.assumptions`, v)}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="mistake">
        <h2 id="mistake">{t("mistakeTitle")}</h2>
        <p>
          {t("mistake")}{" "}
          <ContactLinks email={t("mistakeEmail")} issue={t("mistakeIssues")} />
        </p>
      </section>
    </InfoPage>
  );
}
