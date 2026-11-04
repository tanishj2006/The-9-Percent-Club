import type { Metadata } from "next";
import { Instrument_Serif, IBM_Plex_Mono, Mukta } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Controls } from "@/components/Controls";
import { Footer } from "@/components/Footer";
import { MoneyHud } from "@/components/MoneyHud";
import { ThemeProvider } from "@/components/ThemeProvider";
import { routing } from "@/i18n/routing";
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("meta.title"), description: t("site.tagline") };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>
            <Controls />
            <MoneyHud />
            {children}
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
