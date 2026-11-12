import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, IBM_Plex_Mono, Mukta } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { ThemeProvider } from "@/components/ThemeProvider";
import { routing } from "@/i18n/routing";
import { INDEXABLE, SITE_URL } from "@/lib/site";
import "../globals.css";

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument",
});
const body = Mukta({
  weight: ["400", "600", "700"],
  subsets: ["latin", "devanagari"],
  variable: "--font-mukta",
});
const mono = IBM_Plex_Mono({
  weight: ["500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-plex-mono",
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// The browser chrome follows the page: --bg in each theme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#131316" },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    metadataBase: new URL(SITE_URL),
    title: t("meta.title"),
    description: t("site.tagline"),
    // Google Search Console ownership. Keep it: Google re-checks it.
    verification: { google: "wOUUdjFDEeGayMmyN0NC-mXAMcsW8YefMBUw31DQe24" },
    // Pages that set their own robots (Support) override this.
    ...(INDEXABLE ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Chapter copy reaches the client through ChapterMessages, one chapter at a time.
  const { site, nav, safety } = await getMessages();
  const tagline = (site as { tagline: string }).tagline;

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SiteJsonLd locale={locale} description={tagline} />
        <ThemeProvider>
          <NextIntlClientProvider messages={{ site, nav, safety }}>
            <SiteHeader />
            {children}
            <Footer />
            {/* Production deploys only: previews, local builds and e2e never load it. */}
            {process.env.VERCEL_ENV === "production" && <Analytics />}
            {process.env.VERCEL_ENV === "production" && <SpeedInsights />}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
