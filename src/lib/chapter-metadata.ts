import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CHAPTERS, type ChapterNumber } from "./chapters";
import { absoluteUrl, languageAlternates, SITE_NAME } from "./site";

/** Title, description, canonical, hreflang and social tags for one chapter page. */
export async function chapterMetadata(
  locale: string,
  number: ChapterNumber,
  values: Record<string, string> = {},
): Promise<Metadata> {
  const { href, titleKey } = CHAPTERS.find((chapter) => chapter.number === number)!;
  const t = await getTranslations({ locale });

  const title = t(number === "00" ? "meta.title" : `meta.${titleKey}`);
  const description = t(`${titleKey}.tagline`, values);

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(locale, href), languages: languageAlternates(href) },
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl(locale, href),
      siteName: SITE_NAME,
      locale: locale === "hi" ? "hi_IN" : "en_IN",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
