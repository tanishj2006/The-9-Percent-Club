import { expect, test } from "@playwright/test";

/**
 * What a crawler or answer engine that does not run JavaScript receives: the
 * server HTML and headers only. Runs once, on the desktop project.
 */
test.skip(({ isMobile }) => isMobile, "server HTML is the same for every device");
test.skip(process.env.E2E_DEV === "1", "production behaviour");

const CHAPTERS = ["", "/01", "/02", "/03", "/04", "/05", "/06", "/07", "/08"];
const INFO = ["/about", "/methodology", "/terms", "/privacy"];
const ROUTES = ["en", "hi"].flatMap((l) => [...CHAPTERS, ...INFO].map((p) => `/${l}${p}`));
const GPTBOT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)";

test.describe("server HTML, no JavaScript", () => {
  for (const path of ROUTES) {
    test(`${path} is complete without JavaScript`, async ({ request }) => {
      const res = await request.get(path, { headers: { "User-Agent": GPTBOT }, maxRedirects: 0 });
      expect(res.status()).toBe(200);
      const html = await res.text();
      const locale = path.slice(1, 3);

      expect(html).toContain(`<html lang="${locale}"`);
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
      expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+"/);
      for (const lang of ["en", "hi", "x-default"]) expect(html).toContain(`hrefLang="${lang}"`);

      const ld = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
      expect(ld, "JSON-LD present").not.toBeNull();
      const graph = JSON.parse(ld![1])["@graph"] as { "@type": string }[];
      expect(graph.map((n) => n["@type"])).toEqual(["Person", "WebSite"]);
    });
  }

  test("security headers are set, and no framework or hreflang header leaks", async ({ request }) => {
    const res = await request.get("/en/04");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["content-security-policy"]).not.toContain("unsafe-eval");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-powered-by"]).toBeUndefined();
    expect(h["link"]).toBeUndefined();
  });

  test("security.txt names a contact and a future expiry", async ({ request }) => {
    const body = await (await request.get("/.well-known/security.txt")).text();
    expect(body).toMatch(/^Contact: mailto:\S+@\S+$/m);
    const expires = new Date(body.match(/^Expires: (.+)$/m)![1]);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });
});

/**
 * Key figures the scenes reveal, which a reader without JavaScript or an answer
 * engine must also get. They live in each chapter's server-rendered "In
 * numbers" block (docs/audit-2026-11.md, F-01), so each is checked inside that
 * block, and the block is checked to be neither hidden nor collapsed.
 */
const KEY_FIGURES: Record<string, string[]> = {
  "": ["₹1,00,000", "₹1,20,000", "₹4,400", "₹3,150", "₹3,400"],
  "/01": ["₹2,000", "NSE", "CDSL"],
  "/02": ["₹99.50", "₹100.50", "₹1.00"],
  "/03": ["₹96", "₹106", "₹103", "₹2,030"],
  "/04": ["₹962.38", "₹37.62", "₹23.60"],
  "/05": ["7.30%", "0.36%", "1.99%", "19.9%"],
  "/06": ["28.02%", "₹1,439.60", "325%", "136", "₹6,128"],
  "/07": ["91", "₹1,05,603", "87.7%", "₹91,685"],
  "/08": ["₹3,99,728", "₹2,40,000"],
};

/** The "In numbers" section of a page's server HTML, or null. */
const numbersBlock = (html: string) =>
  html.match(/<section[^>]*data-testid="in-numbers"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? null;

test.describe("key figures in server HTML", () => {
  for (const locale of ["en", "hi"]) {
    for (const [chapter, figures] of Object.entries(KEY_FIGURES)) {
      const path = `/${locale}${chapter}`;
      test(`${path} states ${figures.join(", ")} without JavaScript`, async ({ request }) => {
        const html = await (await request.get(path, { headers: { "User-Agent": GPTBOT } })).text();
        const block = numbersBlock(html);
        expect(block, "In numbers block").not.toBeNull();
        const open = block!.slice(0, block!.indexOf(">") + 1);
        expect(open).not.toMatch(/\shidden|aria-hidden|sr-only|display:\s*none|visibility:\s*hidden/);
        expect(block).toMatch(/<dl[\s>]/);
        for (const f of figures) expect(block, f).toContain(f);
        expect(block, "no unfilled placeholder").not.toMatch(/\{[a-zA-Z0-9]+\}/);
      });
    }

    for (const chapter of ["/06", "/08"]) {
      test(`/${locale}${chapter} has its table of key points in server HTML`, async ({ request }) => {
        const block = numbersBlock(await (await request.get(`/${locale}${chapter}`)).text())!;
        expect(block).toMatch(/<details[^>]*data-testid="see-numbers"/);
        const rows = block.match(/<tr[\s>]/g) ?? [];
        expect(rows.length).toBeGreaterThanOrEqual(chapter === "/08" ? 11 : 9);
      });
    }
  }
});
