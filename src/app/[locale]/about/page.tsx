import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { ContactLinks, InfoPage } from "@/components/InfoPage";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { routeMetadata } from "@/lib/chapter-metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return routeMetadata(locale, "/about", t("metaTitle"), t("description"));
}

export default function About({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations("about");

  return (
    <InfoPage testId="about">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="info-lede">{t("who")}</p>
      <p>{t("why")}</p>
      <p>{t("how")}</p>
      <p>{t("not")}</p>
      <p>
        <Link href="/methodology">{t("methodologyLink")}</Link>
      </p>
      <p>
        {t("contact")} <ContactLinks email={t("contactEmail")} issue={t("contactIssue")} />
      </p>
    </InfoPage>
  );
}
