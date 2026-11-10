import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test.skip(process.env.E2E_DEV === "1", "production behaviour");

test.describe("not found", () => {
  for (const [locale, title, back] of [
    ["en", "This page is not part of the course.", "Back to Chapter 00"],
    ["hi", "यह पन्ना इस course का हिस्सा नहीं है।", "अध्याय 00 पर वापस जाएँ"],
  ] as const) {
    test(`${locale}: an unknown chapter gets a 404 in the reader's language`, async ({ page }) => {
      const response = await page.goto(`/${locale}/09`);
      expect(response?.status()).toBe(404);
      await expect(page.getByTestId("not-found")).toBeVisible();
      await expect(page.locator("h1")).toHaveText(title);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByTestId("site-header")).toBeVisible();
      await expect(page.getByTestId("chapter-map").getByRole("link")).toHaveCount(9);
      await page.getByTestId("back-home").click();
      await expect(page).toHaveURL(new RegExp(`/${locale}$`));
      await expect(page.getByTestId("hero")).toBeVisible();
      await expect(page.getByTestId(`lang-${locale}`)).toHaveAttribute("aria-checked", "true");
      void back;
    });
  }

  test("deep unknown paths are caught too", async ({ page }) => {
    const response = await page.goto("/en/04/no/such/page");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("This page is not part of the course.");
  });

  test("an unknown locale is treated as a path under the default language", async ({ page }) => {
    // next-intl's middleware turns /fr/04 into /en/fr/04, which the catch-all sends to 404.
    const response = await page.goto("/fr/04");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL(/\/en\/fr\/04$/);
    await expect(page.locator("h1")).toHaveText("This page is not part of the course.");
  });

  test("a path the middleware skips gets the bilingual 404, styled like the site", async ({ page }) => {
    const response = await page.goto("/missing.html");
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("not-found")).toContainText("This page is not part of the course.");
    await expect(page.getByTestId("not-found")).toContainText("यह पन्ना इस course का हिस्सा नहीं है।");
    await expect(page.getByRole("link", { name: "Back to Chapter 00" })).toHaveAttribute("href", "/en");
    await expect(page.getByRole("link", { name: "अध्याय 00 पर वापस जाएँ" })).toHaveAttribute("href", "/hi");
    const background = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background, "styled like the site").toBe("rgb(250, 247, 242)");
  });
});

/**
 * The realistic failure: the reader is already in the course, taps Next, and
 * the next chapter's scene chunk never arrives. Page chunks are let through so
 * the app itself keeps running.
 */
async function failNextScene(page: import("@playwright/test").Page, from: string) {
  await open(page, from);
  const loaded = new Set(
    await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name)),
  );
  await page.route("**/_next/static/chunks/**", (route) => {
    const url = route.request().url();
    return loaded.has(url) || url.includes("/chunks/app/") ? route.continue() : route.abort();
  });
  await page.getByTestId("next-chapter").click();
}

test.describe("error boundary", () => {
  test("a scene that fails to load shows the error page, and Try again recovers", async ({ page }) => {
    await failNextScene(page, "/en/04");
    await expect(page).toHaveURL(/\/en\/05$/);

    const boundary = page.getByTestId("error-page");
    await expect(boundary).toBeVisible();
    await expect(boundary.locator("h1")).toHaveText("This chapter did not load.");
    await expect(page.getByTestId("site-header"), "the header survives").toBeVisible();
    await expect(page.getByTestId("back-home")).toHaveAttribute("href", "/en");

    await page.unroute("**/_next/static/chunks/**");
    await page.getByTestId("retry").click();
    await expect(page).toHaveURL(/\/en\/05$/);
    await expect(page.getByTestId("rail")).toBeAttached();
    await expect(boundary).toBeHidden();
  });

  test("Hindi readers get it in Hindi", async ({ page }) => {
    await failNextScene(page, "/hi/05");
    await expect(page.getByTestId("error-page").locator("h1")).toHaveText("यह अध्याय लोड नहीं हुआ।");
    await expect(page.getByTestId("retry")).toHaveText("फिर से कोशिश करें");
  });
});

test.describe("production plumbing", () => {
  test("Vercel Analytics stays out of anything that is not a production deploy", async ({ page }) => {
    const insights: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/_vercel/")) insights.push(r.url());
    });
    await open(page, "/en/04");
    expect(insights).toEqual([]);
  });

  test("share cards exist only for real routes, so none renders on request", async ({ request }) => {
    expect((await request.get("/en/04/opengraph-image")).status()).toBe(200);
    expect((await request.get("/fr/04/opengraph-image")).status()).toBe(404);
    expect((await request.get("/xx/opengraph-image")).status()).toBe(404);
  });
});
