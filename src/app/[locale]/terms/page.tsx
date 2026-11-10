/*
 * REVIEW BEFORE LAUNCH: a qualified person (a lawyer familiar with SEBI's rules
 * on investment advice and research) should review the wording on this page.
 * It was written in plain language as a starting point, not as legal advice.
 */
import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { InfoPage } from "@/components/InfoPage";
import { routing } from "@/i18n/routing";
import { routeMetadata } from "@/lib/chapter-metadata";
import { SUPPORT_ENABLED } from "@/lib/support";

type Props = { params: Promise<{ locale: string }> };

const SECTIONS = ["education", "registration", "figures", "risk", "warranty", "links", "support", "copyright", "law"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return routeMetadata(locale, "/terms", t("metaTitle"), t("description"));
}

export default function Terms({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations("terms");

  return (
    <InfoPage testId="terms">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="info-lede">{t("lede")}</p>
      {SECTIONS.filter((section) => section !== "support" || SUPPORT_ENABLED).map((section) => (
        <section key={section} aria-labelledby={`terms-${section}`} data-testid={`terms-${section}`}>
          <h2 id={`terms-${section}`}>{t(`${section}.title`)}</h2>
          <p>{t(`${section}.text`)}</p>
        </section>
      ))}
      <p className="info-updated">{t("updated")}</p>
    </InfoPage>
  );
}
