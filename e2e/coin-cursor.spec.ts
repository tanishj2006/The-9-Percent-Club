import { expect, test } from "@playwright/test";
import { open, scrollToPct } from "./helpers";

const cursorOf = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => getComputedStyle(el).cursor);

test("the coin file is small and really is 32px", async ({ request }) => {
  const response = await request.get("/coin.svg");
  expect(response.status()).toBe(200);
  const svg = await response.text();
  expect(svg).toContain('width="32"');
  expect(svg).toContain('height="32"');
  expect(svg.length).toBeLessThan(1024);
});

test.describe("on a desktop with a mouse", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("the token grid and the Hold or Sell buttons get the coin", async ({ page }) => {
    await open(page, "/en");
    expect(await cursorOf(page, ".grid-wrap svg")).toContain("coin.svg");
    await open(page, "/en/06");
    await scrollToPct(page, ((3 + 0.5) / 8) * 100);
    await expect(page.getByTestId("choose-sell")).toBeVisible();
    expect(await cursorOf(page, "[data-testid=choose-sell]")).toContain("coin.svg");
    expect(await cursorOf(page, "[data-testid=choose-sell]")).toContain("pointer");
  });

  test("nothing else does", async ({ page }) => {
    await open(page, "/en/06");
    for (const selector of ["body", "[data-testid=chapter-toggle]", "[data-testid=theme-toggle]", "a", ".doubt summary"]) {
      expect(await cursorOf(page, selector), selector).not.toContain("coin.svg");
    }
    await open(page, "/en/07");
    expect(await cursorOf(page, "[data-testid=crowd]"), "the Chapter 07 crowd is not the token grid").not.toContain("coin.svg");
  });
});

test.describe("on a touch screen", () => {
  test.skip(({ isMobile }) => !isMobile, "touch only");

  test("there is no coin anywhere", async ({ page }) => {
    await open(page, "/en");
    expect(await cursorOf(page, ".grid-wrap svg")).not.toContain("coin.svg");
    await open(page, "/en/06");
    expect(await cursorOf(page, "[data-testid=choose-sell]")).not.toContain("coin.svg");
  });
});
