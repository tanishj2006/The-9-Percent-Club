import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CHAPTERS } from "@/lib/chapters";
import { absoluteUrl, languageAlternates } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return CHAPTERS.flatMap(({ href }) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, href),
      alternates: { languages: languageAlternates(href) },
    })),
  );
}
