import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

const BUDGET_GZIP = 200 * 1024;

test.skip(process.env.E2E_DEV === "1", "production bundles only");
test.skip(({ isMobile }) => isMobile, "same bundle");

const CHAPTERS = ["", "/04", "/05", "/06", "/07", "/08"];

for (const path of CHAPTERS.flatMap((c) => [`/en${c}`, `/hi${c}`])) {
  test(`${path}: GSAP and Lenis stay out of the initial bundle, which is under budget`, async ({
    request,
    baseURL,
  }) => {
    const html = await (await request.get(path)).text();
    const urls = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);

    let total = 0;
    for (const url of new Set(urls)) {
      const body = await (await request.get(new URL(url, baseURL).href)).body();
      total += gzipSync(body).length;
      const text = body.toString();
      expect(text, `${url} contains ScrollTrigger`).not.toContain("ScrollTrigger");
      expect(text, `${url} contains gsap`).not.toMatch(/GreenSock|gsap\.com/i);
      expect(text, `${url} contains Lenis`).not.toContain("lenis-smooth");
      expect(text, `${url} contains the drawdown data`).not.toContain("2020-03-24");
    }
    console.log(`${path}: ${new Set(urls).size} scripts, ${(total / 1024).toFixed(1)} KB gzipped`);
    expect(total).toBeLessThan(BUDGET_GZIP);
  });
}

test("the scene chunk loads on the client, with GSAP inside it", async ({ page }) => {
  const chunks: string[] = [];
  page.on("response", async (res) => {
    if (res.url().endsWith(".js") && (await res.text()).includes("ScrollTrigger")) {
      chunks.push(res.url());
    }
  });
  await page.goto("/en");
  await expect(page.getByTestId("scene")).toBeVisible();
  await expect.poll(() => chunks.length).toBeGreaterThan(0);
});
