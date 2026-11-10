/*
 * Exists only when NEXT_PUBLIC_UPI_ID and NEXT_PUBLIC_UPI_NAME are set at build
 * time; otherwise this route is a 404 and the footer link is hidden.
 *
 * SITEMAP NOTE: this page is noindex, and it is also listed in the sitemap
 * because that was asked for. Search engines treat a noindex page in a sitemap
 * as a mixed signal. To drop it, remove the "/support" entry from SITE_HREFS in
 * src/lib/site.ts.
 */
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { InfoPage } from "@/components/InfoPage";
import { routing } from "@/i18n/routing";
import { routeMetadata } from "@/lib/chapter-metadata";
import { upiConfig, upiLink } from "@/lib/support";

type Props = { params: Promise<{ locale: string }> };

const POINTS = ["voluntary", "refund", "nothing", "unrelated"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "support" });
  return {
    ...routeMetadata(locale, "/support", t("metaTitle"), t("description")),
    robots: { index: false, follow: true },
  };
}

export default async function Support({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const config = upiConfig();
  if (!config) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "support" });
  const link = upiLink(config);
  // Drawn here, at build time: no QR service, no script. Dark modules on white,
  // in both themes, because that is what phone cameras read most reliably.
  const qr = await QRCode.toString(link, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#1a1a1f", light: "#ffffff" },
  });

  return (
    <InfoPage testId="support">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="info-lede">{t("lede")}</p>

      <div className="support-pay">
        <a className="support-button" href={link} data-testid="upi-button">
          {t("button")}
        </a>
        <figure className="support-qr" data-testid="upi-qr">
          <div className="support-qr-code" role="img" aria-label={t("qrAlt")} dangerouslySetInnerHTML={{ __html: qr }} />
          <figcaption>{t("qrCaption")}</figcaption>
        </figure>
        <p className="support-id">
          {t("idLabel")} <code data-testid="upi-id">{config.pa}</code>
        </p>
      </div>

      <ul className="info-list" data-testid="support-points">
        {POINTS.map((point) => (
          <li key={point}>{t(`points.${point}`)}</li>
        ))}
      </ul>
    </InfoPage>
  );
}
