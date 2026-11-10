import { expect, test, type Page } from "@playwright/test";
import { open } from "./helpers";

const PATHS = ["", "/01", "/02", "/03", "/04", "/05", "/06", "/07", "/08"];
const ROUTES = PATHS.flatMap((p) => [`/en${p}`, `/hi${p}`]);

const doubts = (page: Page) => page.getByTestId("doubt");

test.describe("doubts on every route", () => {
  for (const route of ROUTES) {
    test(`${route}: answers start closed and open on click`, async ({ page }) => {
      await page.goto(route);
      const count = await doubts(page).count();
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(4);

      for (let i = 0; i < count; i++) {
        const doubt = doubts(page).nth(i);
        const answer = doubt.locator("p");
        await expect(answer).toBeHidden();
        await doubt.locator("summary").click();
        await expect(answer).toBeVisible();
        expect((await answer.textContent())!.length).toBeGreaterThan(40);
      }
      await expect(page.locator("body")).not.toContainText(/\{[a-zA-Z0-9]+\}/);
    });
  }
});

test.describe("doubts behave", () => {
  test("sit after the chapter's ending and before the chapter nav", async ({ page }) => {
    await page.goto("/en/04");
    const order = await page.evaluate(() => {
      const y = (s: string) => document.querySelector(s)!.getBoundingClientRect().top + scrollY;
      return [y(".outro"), y("[data-testid=doubts]"), y("[data-testid=chapter-nav]")];
    });
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  test("the keyboard opens and closes an answer", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await page.goto("/en/01");
    const first = doubts(page).first();
    await first.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(first.locator("p")).toBeVisible();
    await page.keyboard.press("Space");
    await expect(first.locator("p")).toBeHidden();
  });

  test("works with JavaScript switched off", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/hi/07");
    const first = doubts(page).first();
    await first.locator("summary").click();
    await expect(first.locator("p")).toBeVisible();
    await context.close();
  });

  test("makes no API call when opened", async ({ page }) => {
    await page.goto("/en/04");
    await page.waitForLoadState("networkidle");
    const requests: string[] = [];
    // Next may prefetch the Previous and Next links as they scroll into view.
    const prefetch = /_rsc=|\/_next\/static\//;
    page.on("request", (r) => {
      if (!prefetch.test(r.url())) requests.push(r.url());
    });
    for (const summary of await page.locator(".doubt summary").all()) await summary.click();
    await page.waitForTimeout(300);
    expect(requests).toEqual([]);
  });

  test("no request on any chapter leaves the site", async ({ page, baseURL }) => {
    const outside: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith(baseURL!) && !r.url().startsWith("data:")) outside.push(r.url());
    });
    for (const path of PATHS) await page.goto(`/en${path}`);
    expect(outside).toEqual([]);
  });

  test("opening every answer does not trap the page: the nav is still reachable", async ({ page }) => {
    await open(page, "/en/05");
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect(page.getByTestId("doubts")).toBeVisible();
    for (const summary of await page.locator(".doubt summary").all()) await summary.click();
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect(page.getByTestId("prev-chapter")).toBeInViewport();
    await expect(page.locator("footer")).toBeInViewport();
  });

  test("the scene still works after opening an answer", async ({ page }) => {
    await open(page, "/en/04");
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await doubts(page).first().locator("summary").click();
    await expect.poll(() => page.getByTestId("hud-value").textContent()).toBe("₹962.38");
  });

  test("the answers are in the HTML, for readers and crawlers", async ({ request }) => {
    const html = await (await request.get("/en/07")).text();
    expect(html).toContain("mutual fund SIPs");
    expect(html).toContain("That study counts individual traders");
  });

  test("a chapter's doubts do not reach the client twice or leak to other chapters", async ({ request }) => {
    const html = await (await request.get("/en/01")).text();
    expect(html).not.toContain("mutual fund SIPs");
    expect(html.split("shuts down tomorrow").length).toBeLessThanOrEqual(3);
  });
});
