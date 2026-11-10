import { expect, test } from "@playwright/test";

// Runs against the second build, which has test-only UPI details.
const SITE = "https://e2e.example";
const ID = "ninepercent.e2e@okexample";

test.describe("with UPI details", () => {
  for (const locale of ["en", "hi"] as const) {
    test(`/${locale}/support renders, noindex, with its own canonical and hreflang`, async ({ page }) => {
      const response = await page.goto(`/${locale}/support`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/${locale}/support`);
      await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", `${SITE}/en/support`);
      await expect(page.locator('link[hreflang="hi"]')).toHaveAttribute("href", `${SITE}/hi/support`);
      await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute("href", `${SITE}/en/support`);
    });
  }

  test("the copy is the agreed copy, with no amounts, goals or urgency", async ({ page }) => {
    await page.goto("/en/support");
    await expect(page.locator(".info-lede")).toHaveText("This site is free and stays free. If it helped, you can chip in. Nothing changes if you do not.");
    const points = page.getByTestId("support-points");
    for (const p of ["voluntary", "non-refundable", "no access, no advice", "not related to any investment content"]) {
      await expect(points).toContainText(p);
    }
    const text = (await page.getByTestId("support").textContent())!.replace(ID, "");
    expect(text).not.toMatch(/₹|\d|goal|target|today|now|hurry|last chance|thank you|perk|reward|badge/i);
  });

  test("the footer links to it, in the link row, and it resolves", async ({ page, request }) => {
    await page.goto("/en/04");
    const link = page.getByTestId("site-footer").locator(".footer-links").getByTestId("support-link");
    await expect(link).toHaveText("Support this project");
    await expect(link).toHaveAttribute("href", "/en/support");
    expect((await request.get("/en/support")).status()).toBe(200);
    await page.goto("/hi");
    await expect(page.getByTestId("support-link")).toHaveText("इस project का साथ दें");
  });

  test("it appears nowhere inside a chapter", async ({ page }) => {
    for (const path of ["/en", "/en/04", "/en/08"]) {
      await page.goto(path);
      await expect(page.locator("main")).not.toContainText("chip in");
      await expect(page.locator("main a[href^='upi:']")).toHaveCount(0);
    }
  });

  test("the sitemap lists it in both languages", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`<loc>${SITE}/en/support</loc>`);
    expect(xml).toContain(`<loc>${SITE}/hi/support</loc>`);
  });

  test("the deep link has the right params, and no amount", async ({ page }) => {
    await page.goto("/en/support");
    const href = (await page.getByTestId("upi-button").getAttribute("href"))!;
    expect(href.startsWith("upi://pay?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("pa")).toBe(ID);
    expect(params.get("pn")).toBe("Tanish Jain");
    expect(params.get("cu")).toBe("INR");
    expect([...params.keys()].sort()).toEqual(["cu", "pa", "pn"]);
    await expect(page.getByTestId("upi-id")).toHaveText(ID);
  });

  test("phones get the button; desktops get the QR", async ({ page, isMobile }) => {
    await page.goto("/en/support");
    if (isMobile) {
      await expect(page.getByTestId("upi-button")).toBeVisible();
      await expect(page.getByTestId("upi-qr")).toBeHidden();
      expect((await page.getByTestId("upi-button").boundingBox())!.height).toBeGreaterThanOrEqual(44);
    } else {
      await expect(page.getByTestId("upi-qr")).toBeVisible();
      await expect(page.getByTestId("upi-button")).toBeHidden();
    }
  });

  test("the QR is an inline SVG drawn at build time, and nothing is fetched to make it", async ({ page, baseURL }) => {
    const outside: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith(baseURL!) && !r.url().startsWith("data:")) outside.push(r.url());
    });
    await page.goto("/en/support");
    const svg = page.getByTestId("upi-qr").locator("svg");
    await expect(svg).toHaveCount(1);
    expect(await svg.locator("path").count()).toBeGreaterThan(0);
    await expect(page.getByTestId("upi-qr").locator("img")).toHaveCount(0);
    expect(outside).toEqual([]);
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`390px ${scheme}: no sideways scroll, and the QR stays dark on white`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ colorScheme: scheme });
      for (const locale of ["en", "hi"]) {
        await page.goto(`/${locale}/support`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      }
      const background = await page.locator(".support-qr-code").evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(background).toBe("rgb(255, 255, 255)");
    });
  }

  test("reduced motion: nothing on the page animates", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/hi/support");
    expect(await page.getByTestId("support").evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    await context.close();
  });

  test("terms and privacy carry the same points", async ({ page }) => {
    await page.goto("/en/terms");
    const terms = page.getByTestId("terms-support");
    await expect(terms).toContainText("voluntary and non-refundable");
    await expect(terms).toContainText("no access, no advice");
    await expect(terms).toContainText("not related to any investment content");
    await page.goto("/en/privacy");
    await expect(page.getByTestId("privacy-payments")).toContainText("your own UPI app and your bank");
    await expect(page.getByTestId("privacy-payments")).toContainText("never sees or stores");
  });
});
