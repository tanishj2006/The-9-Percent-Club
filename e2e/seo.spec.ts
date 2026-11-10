import { expect, test } from "@playwright/test";

test.skip(process.env.E2E_DEV === "1", "production build only");
test.skip(({ isMobile }) => isMobile, "same HTML");

const SITE = "https://e2e.example";
const PATHS = ["", "/01", "/02", "/03", "/04", "/05", "/06", "/07", "/08"];
const ROUTES = PATHS.flatMap((p) => [`/en${p}`, `/hi${p}`]);

const attr = (html: string, pattern: RegExp) => html.match(pattern)?.[1];

test.describe("metadata on every route", () => {
  for (const route of ROUTES) {
    test(`${route}: canonical, hreflang and social tags`, async ({ request }) => {
      const response = await request.get(route);
      expect(response.status()).toBe(200);
      const html = await response.text();
      const path = route.replace(/^\/(en|hi)/, "");

      expect(attr(html, /<link rel="canonical" href="([^"]+)"/)).toBe(`${SITE}${route}`);
      expect(attr(html, /<link rel="alternate" hrefLang="en" href="([^"]+)"/)).toBe(`${SITE}/en${path}`);
      expect(attr(html, /<link rel="alternate" hrefLang="hi" href="([^"]+)"/)).toBe(`${SITE}/hi${path}`);
      expect(attr(html, /<link rel="alternate" hrefLang="x-default" href="([^"]+)"/)).toBe(`${SITE}/en${path}`);

      expect(attr(html, /<meta property="og:url" content="([^"]+)"/)).toBe(`${SITE}${route}`);
      expect(attr(html, /<meta property="og:site_name" content="([^"]+)"/)).toBe("The 9% Club");
      expect(attr(html, /<meta property="og:title" content="([^"]+)"/)).toContain("The 9% Club");
      expect(attr(html, /<meta name="twitter:card" content="([^"]+)"/)).toBe("summary_large_image");
      expect(attr(html, /<meta name="description" content="([^"]+)"/)!.length).toBeGreaterThan(40);
      expect(attr(html, /<meta property="og:image" content="([^"]+)"/)).toContain(`${SITE}${route}/opengraph-image`);
      expect(attr(html, /<meta property="og:image:width" content="([^"]+)"/)).toBe("1200");
      expect(attr(html, /<meta property="og:image:height" content="([^"]+)"/)).toBe("630");
    });

    test(`${route}: the share card is a real 1200×630 PNG`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      const image = attr(html, /<meta property="og:image" content="([^"]+)"/)!.replace(SITE, "");
      const response = await request.get(image.replace(/&amp;/g, "&"));
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("image/png");
      const png = await response.body();
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
      expect(png.length, "light enough for WhatsApp").toBeLessThan(300 * 1024);
    });
  }

  test("each chapter has its own title and description", async ({ request }) => {
    const seen = new Set<string>();
    for (const route of ROUTES) {
      const html = await (await request.get(route)).text();
      seen.add(attr(html, /<title>([^<]+)<\/title>/)!);
    }
    expect(seen.size).toBe(18);
  });

  test("Hindi pages are marked as Hindi", async ({ request }) => {
    const html = await (await request.get("/hi/04")).text();
    expect(html).toContain('<html lang="hi"');
    expect(attr(html, /<meta property="og:locale" content="([^"]+)"/)).toBe("hi_IN");
  });
});

test("sitemap.xml lists all 18 routes with hreflang", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  expect(urls).toEqual(ROUTES.map((r) => `${SITE}${r}`).sort());
  expect(xml.match(/hreflang="hi"/g)).toHaveLength(18);
  expect(xml).not.toContain("localhost");
});

test("robots.txt points at the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain("Allow: /");
  expect(text).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});
