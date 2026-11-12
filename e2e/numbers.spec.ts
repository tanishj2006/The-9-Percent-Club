import { expect, test, type Page } from "@playwright/test";

/**
 * The "In numbers" block is for readers as much as for crawlers, so it must be
 * plainly visible in a normal browser: text shown only to crawlers is against
 * Google's guidelines. See docs/audit-2026-11.md, F-01.
 */

const PATHS = ["", "/01", "/02", "/03", "/04", "/05", "/06", "/07", "/08"];
const ROUTES = PATHS.flatMap((p) => [`/en${p}`, `/hi${p}`]);

const block = (page: Page) => page.getByTestId("in-numbers");

/** Whether an element, and everything above it, is drawn and not clipped away. */
const drawn = (page: Page) =>
  block(page).evaluate((el) => {
    const problems: string[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.display === "none") problems.push("display");
      if (s.visibility !== "visible") problems.push("visibility");
      if (Number(s.opacity) < 1) problems.push("opacity");
      if (s.clipPath !== "none" || (s.clip !== "auto" && s.clip !== "")) problems.push("clip");
      if (node.getAttribute("aria-hidden") === "true") problems.push("aria-hidden");
    }
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 100) problems.push(`size ${r.width}x${r.height}`);
    return problems;
  });

test.describe("In numbers on every chapter", () => {
  for (const route of ROUTES) {
    test(`${route}: visible, filled in, after the outro and before the doubts`, async ({ page }) => {
      await page.goto(route);
      await block(page).scrollIntoViewIfNeeded();
      await expect(block(page)).toBeVisible();
      await expect(block(page).locator("h2")).toBeVisible();
      expect(await drawn(page)).toEqual([]);

      const items = block(page).getByTestId("in-numbers-item");
      expect(await items.count()).toBeGreaterThanOrEqual(3);
      for (const item of await items.all()) {
        await expect(item).toBeVisible();
        await expect(item.locator("dd")).toHaveText(/\S.{30,}/);
      }
      await expect(block(page)).not.toContainText(/\{[a-zA-Z0-9]+\}/);

      const order = await page.evaluate(() => {
        const y = (s: string) => document.querySelector(s)!.getBoundingClientRect().top + scrollY;
        return [y(".outro"), y("[data-testid=in-numbers]"), y("[data-testid=doubts]")];
      });
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });
  }
});

test.describe("See the numbers", () => {
  for (const route of ["/en/06", "/hi/06", "/en/08", "/hi/08"]) {
    test(`${route}: the table starts closed and opens on click`, async ({ page }) => {
      await page.goto(route);
      const details = page.getByTestId("see-numbers");
      const table = details.locator("table");
      await expect(table).toBeHidden();
      await details.locator("summary").click();
      await expect(table).toBeVisible();
      expect(await table.locator("tbody tr").count()).toBeGreaterThanOrEqual(route.endsWith("08") ? 10 : 8);
    });
  }

  test("works with JavaScript switched off", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/hi/06");
    await expect(block(page)).toBeVisible();
    await expect(block(page)).toContainText("₹1,439.60");
    await page.getByTestId("see-numbers").locator("summary").click();
    await expect(page.getByTestId("see-numbers").locator("table")).toBeVisible();
    await context.close();
  });
});

for (const scheme of ["light", "dark"] as const) {
  test(`390px ${scheme}: the block and its tables fit, with readable contrast`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: scheme });
    for (const route of ["/en/06", "/hi/06", "/en/08", "/hi/08", "/hi/05", "/en/04"]) {
      await page.goto(route);
      const details = page.getByTestId("see-numbers");
      if (await details.count()) await details.locator("summary").click();
      const sizes = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>("[data-testid=in-numbers]")!;
        const scroll = el.querySelector<HTMLElement>(".numbers-scroll");
        return {
          page: document.documentElement.scrollWidth,
          block: el.scrollWidth - el.clientWidth,
          table: scroll ? scroll.scrollWidth - scroll.clientWidth : 0,
        };
      });
      expect(sizes.page, `${route} page width`).toBeLessThanOrEqual(390);
      expect(sizes.block, `${route} block overflow`).toBeLessThanOrEqual(0);
      expect(sizes.table, `${route} table overflow`).toBeLessThanOrEqual(0);

      const ratios = await page.evaluate(() => {
        const lum = (c: string) => {
          const [r, g, b] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map((v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const bg = lum(getComputedStyle(document.body).backgroundColor);
        const sel = "[data-testid=in-numbers] :is(dt, dd, p, caption, th, td)";
        return [...document.querySelectorAll<HTMLElement>(sel)]
          .filter((el) => el.offsetParent)
          .map((el) => {
            const fg = lum(getComputedStyle(el).color);
            return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
          });
      });
      expect(Math.min(...ratios), `${route} lowest contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
