import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { CHAPTERS } from "./chapters";
import { absoluteUrl, languageAlternates, localizedPath, SITE_URL } from "./site";

describe("paths", () => {
  it("puts chapter 00 at the locale root", () => {
    expect(localizedPath("en", "/")).toBe("/en");
    expect(localizedPath("hi", "/")).toBe("/hi");
    expect(localizedPath("hi", "/04")).toBe("/hi/04");
  });
});

describe("hreflang", () => {
  it("links every language version, with English as the default", () => {
    expect(languageAlternates("/04")).toEqual({
      en: `${SITE_URL}/en/04`,
      hi: `${SITE_URL}/hi/04`,
      "x-default": `${SITE_URL}/en/04`,
    });
  });
});

describe("sitemap", () => {
  const entries = sitemap();

  it("lists all 26 routes, once each: nine chapters and four info pages, in two languages", () => {
    expect(CHAPTERS).toHaveLength(9);
    expect(entries).toHaveLength(26);
    expect(new Set(entries.map((e) => e.url)).size).toBe(26);
  });

  it("includes the four info pages in both languages", () => {
    const urls = entries.map((e) => e.url.replace(SITE_URL, ""));
    for (const locale of ["en", "hi"]) {
      for (const page of ["about", "methodology", "terms", "privacy"]) {
        expect(urls).toContain(`/${locale}/${page}`);
      }
    }
  });

  it("includes both roots and every chapter in both languages", () => {
    const urls = entries.map((e) => e.url.replace(SITE_URL, ""));
    for (const locale of ["en", "hi"]) {
      expect(urls).toContain(`/${locale}`);
      for (const n of ["01", "02", "03", "04", "05", "06", "07", "08"]) {
        expect(urls).toContain(`/${locale}/${n}`);
      }
    }
  });

  it("gives every entry its language alternates, including itself", () => {
    for (const entry of entries) {
      const languages = entry.alternates!.languages! as Record<string, string>;
      expect(Object.keys(languages).sort()).toEqual(["en", "hi", "x-default"]);
      expect(Object.values(languages)).toContain(entry.url);
    }
  });
});

describe("robots", () => {
  it("allows everything and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});

describe("SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const load = async () => (await import("./site")).SITE_URL;

  it("prefers the configured address and drops a trailing slash", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "other.vercel.app");
    expect(await load()).toBe("https://example.com");
  });

  it("falls back to Vercel's production URL, over https", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined as unknown as string);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "nine.vercel.app");
    expect(await load()).toBe("https://nine.vercel.app");
  });

  it("uses localhost only when nothing is set", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined as unknown as string);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined as unknown as string);
    expect(await load()).toBe("http://localhost:3000");
  });

  it("builds hreflang for info pages the same way as chapters", () => {
    expect(languageAlternates("/privacy")).toEqual({
      en: `${SITE_URL}/en/privacy`,
      hi: `${SITE_URL}/hi/privacy`,
      "x-default": `${SITE_URL}/en/privacy`,
    });
  });

  it("keeps the absolute helper on the same base", () => {
    expect(absoluteUrl("hi", "/08")).toBe(`${SITE_URL}/hi/08`);
  });
});
