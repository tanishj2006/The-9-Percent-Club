import { CHAPTERS } from "./chapters";
import { routing } from "@/i18n/routing";

/**
 * The site's public address, for canonical links, hreflang and the sitemap. Set
 * NEXT_PUBLIC_SITE_URL once there is a custom domain. On Vercel it falls back to
 * the project's production URL. Locally it is localhost, which must never ship.
 */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "The 9% Club";

type Href = (typeof CHAPTERS)[number]["href"];

/** `/en` for chapter 00, `/en/04` for the rest. */
export const localizedPath = (locale: string, href: Href) =>
  href === "/" ? `/${locale}` : `/${locale}${href}`;

export const absoluteUrl = (locale: string, href: Href) =>
  `${SITE_URL}${localizedPath(locale, href)}`;

/** Every language version of a chapter, plus the default for everyone else. */
export function languageAlternates(href: Href) {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, absoluteUrl(locale, href)])),
    "x-default": absoluteUrl(routing.defaultLocale, href),
  };
}
