import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates, SITE_HREFS } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_HREFS.flatMap((href) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, href),
      alternates: { languages: languageAlternates(href) },
    })),
  );
}
