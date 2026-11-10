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
 * Key figures that today exist only inside the animated scene, so a reader
 * without JavaScript, or an answer engine, never sees them. Each becomes a
 * real test once the chapter renders the figure as server text. See
 * docs/audit-2026-11.md, "crawlability".
 */
const PENDING: Record<string, string[]> = {
  "/en/02": ["₹99.50"],
  "/en/03": ["₹96", "₹106"],
  "/en/04": ["₹962.38"],
  "/en/05": ["7.30%", "0.36%"],
  "/en/06": ["28.02%", "₹1,439.60", "325%", "136"],
  "/en/07": ["₹1,05,603"],
  "/en/08": ["₹3,99,728", "₹2,40,000"],
};

test.describe("key figures in server HTML", () => {
  for (const [path, figures] of Object.entries(PENDING)) {
    test.fixme(`${path} states ${figures.join(", ")} without JavaScript`, async ({ request }) => {
      const html = await (await request.get(path)).text();
      for (const f of figures) expect(html).toContain(f);
    });
  }
});
