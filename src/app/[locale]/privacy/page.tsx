/*
 * KEEP THIS PAGE TRUE. It describes what the code does today:
 * - next-themes stores "npc-theme" in localStorage (src/components/ThemeProvider.tsx)
 * - next-intl sets the session cookie "NEXT_LOCALE" when the language is switched
 * - the support page exists only when NEXT_PUBLIC_UPI_ID and _NAME are set, and
 *   hands payment to the reader's own UPI app (src/lib/support.ts)
 * - @vercel/analytics renders only when VERCEL_ENV is "production"
 *   (src/app/[locale]/layout.tsx), described from Vercel's own documentation
 * If any of that changes, or anything new stores data or calls a third party,
 * update this page in both en.json and hi.json, and e2e/trust.spec.ts.
 */
import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { ContactLinks, InfoPage } from "@/components/InfoPage";
import { routing } from "@/i18n/routing";
import { routeMetadata } from "@/lib/chapter-metadata";
import { SUPPORT_ENABLED } from "@/lib/support";
import { STORED, VERCEL_ANALYTICS_PRIVACY } from "@/lib/privacy";

type Props = { params: Promise<{ locale: string }> };

const ANALYTICS_POINTS = ["time", "url", "route", "referrer", "query", "location", "os", "browser", "device", "version"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return routeMetadata(locale, "/privacy", t("metaTitle"), t("description"));
}

export default function Privacy({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations("privacy");

  return (
    <InfoPage testId="privacy">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="info-lede">{t("lede")}</p>

      <section aria-labelledby="stored">
        <h2 id="stored">{t("storedTitle")}</h2>
        <p>{t("storedLede")}</p>
        <dl className="info-footnotes">
          {STORED.map(({ name, kind, key }) => (
            <div key={name}>
              <dt>
                <code data-testid="stored-name">{name}</code> · {t(`kinds.${kind}`)}
              </dt>
              <dd>{t(`stored.${key}`)}</dd>
            </div>
          ))}
        </dl>
        <p>{t("storedNothingElse")}</p>
      </section>

      <section aria-labelledby="analytics">
        <h2 id="analytics">{t("analyticsTitle")}</h2>
        <p>{t("analyticsWhen")}</p>
        <p>{t("analyticsHow")}</p>
        <ul className="info-list">
          {ANALYTICS_POINTS.map((point) => (
            <li key={point}>{t(`analyticsPoints.${point}`)}</li>
          ))}
        </ul>
        <p>
          <a href={VERCEL_ANALYTICS_PRIVACY}>{t("analyticsSource")}</a>
        </p>
      </section>

      <section aria-labelledby="hosting">
        <h2 id="hosting">{t("hostingTitle")}</h2>
        <p>{t("hosting")}</p>
        <p>{t("portfolioLink")}</p>
      </section>

      {SUPPORT_ENABLED && (
        <section aria-labelledby="payments" data-testid="privacy-payments">
          <h2 id="payments">{t("paymentsTitle")}</h2>
          <p>{t("payments")}</p>
        </section>
      )}

      <section aria-labelledby="none">
        <h2 id="none">{t("noneTitle")}</h2>
        <p>{t("none")}</p>
      </section>

      <section aria-labelledby="contact">
        <h2 id="contact">{t("contactTitle")}</h2>
        <p>
          {t("contact")} <ContactLinks email={t("contactEmail")} issue={t("contactIssues")} />
        </p>
        <p data-testid="privacy-email">{t("contactEmailPrivacy")}</p>
        <p>{t("contactIssuesWarning")}</p>
      </section>

      <p className="info-updated">{t("updated")}</p>
    </InfoPage>
  );
}
