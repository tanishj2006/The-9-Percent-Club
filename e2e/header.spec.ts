import { expect, test, type Page } from "@playwright/test";
import { switchLanguage } from "./helpers";

const box = (page: Page, testId: string) => page.getByTestId(testId).boundingBox().then((b) => b!);
const focused = (page: Page) => page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
const card = (page: Page) => page.getByTestId("chapter-switcher").locator(".menu-card");

test.describe("brand", () => {
  test("badge and wordmark link home in both languages", async ({ page }) => {
    for (const locale of ["en", "hi"]) {
      await page.goto(`/${locale}/05`);
      const brand = page.getByTestId("brand");
      await expect(brand).toBeVisible();
      await expect(brand).toContainText("The 9% Club");
      await expect(brand.locator("svg text")).toHaveText("9%");
      await brand.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    }
  });

  test("the wordmark stays in Instrument Serif on Hindi pages", async ({ page }) => {
    await page.goto("/hi/02");
    const family = await page.locator(".brand-name").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toMatch(/instrument/);
  });
});

test.describe("zones", () => {
  test("left to right: brand, chapters, language, theme, then the HUD", async ({ page, isMobile }) => {
    test.skip(isMobile, "phones stack the left side");
    await page.goto("/en/04");
    const [brand, chapters, language, theme, hud] = await Promise.all(
      ["brand", "chapter-toggle", "lang-toggle", "theme-toggle", "hud"].map((id) => box(page, id)),
    );
    expect(brand.x).toBeLessThan(chapters.x);
    expect(chapters.x + chapters.width).toBeLessThan(language.x);
    expect(language.x).toBeLessThan(theme.x);
    expect(theme.x + theme.width).toBeLessThan(hud.x);
    const viewport = page.viewportSize()!;
    expect(hud.x + hud.width).toBeGreaterThan(viewport.width - 30);
  });

  test("on a phone the HUD keeps its place on the right of both rows", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone layout");
    await page.goto("/hi/04");
    const [brand, chapters, theme, hud] = await Promise.all(
      ["brand", "chapter-toggle", "theme-toggle", "hud"].map((id) => box(page, id)),
    );
    expect(chapters.y, "chapters sit under the brand").toBeGreaterThan(brand.y + brand.height - 1);
    expect(theme.x + theme.width).toBeLessThan(hud.x);
    expect(brand.x + brand.width).toBeLessThan(hud.x);
    await expect(page.locator(".brand-name")).toBeVisible();
  });

  test("the header is opaque, so nothing scrolls under the brand", async ({ page }) => {
    await page.goto("/en/04");
    const background = await page.getByTestId("site-header").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("the HUD's border is accented, not the utilities' grey", async ({ page }) => {
    await page.goto("/en/04");
    const colour = (id: string) => page.getByTestId(id).evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(await colour("hud")).not.toBe(await colour("theme-toggle"));
  });
});

test.describe("chapter menu", () => {
  test("the pill says where you are, in each language", async ({ page, isMobile }) => {
    await page.goto("/en/04");
    const trigger = page.getByTestId("chapter-toggle");
    await expect(trigger).toContainText("Ch 04");
    if (!isMobile) {
      await expect(trigger).toContainText("What a trade really costs");
      await expect(trigger).toContainText("5/9");
    }
    await page.goto("/hi/00".replace("/00", ""));
    await expect(page.getByTestId("chapter-toggle")).toContainText("अध्याय 00");
  });

  test("opens onto all nine, with the current one marked", async ({ page }) => {
    await page.goto("/en/06");
    await expect(card(page)).toBeHidden();
    await page.getByTestId("chapter-toggle").click();
    await expect(page.getByTestId("chapter-toggle")).toHaveAttribute("aria-expanded", "true");
    await expect(card(page)).toBeVisible();
    await expect(card(page)).toContainText("Chapters");
    const links = card(page).getByRole("link");
    await expect(links).toHaveCount(9);
    await expect(links.nth(6)).toHaveAttribute("aria-current", "page");
    await expect(links.nth(6)).toContainText("06");
    await expect(links.nth(6)).toContainText("What losing looks like");
    const accent = await links.nth(6).evaluate((el) => getComputedStyle(el).borderLeftColor);
    const plain = await links.nth(0).evaluate((el) => getComputedStyle(el).borderLeftColor);
    expect(accent).not.toBe(plain);
  });

  test("the keyboard walks it: arrows, Home, End, Escape", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await page.goto("/en/03");
    await page.getByTestId("chapter-toggle").focus();
    await page.keyboard.press("ArrowDown");
    await expect(card(page)).toBeVisible();
    expect(await focused(page), "starts on the current chapter").toContain("03");
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toContain("04");
    await page.keyboard.press("End");
    expect(await focused(page)).toContain("08");
    await page.keyboard.press("ArrowDown");
    expect(await focused(page), "wraps around").toContain("00");
    await page.keyboard.press("Home");
    expect(await focused(page)).toContain("00");
    await page.keyboard.press("Escape");
    await expect(card(page)).toBeHidden();
    await expect(page.getByTestId("chapter-toggle")).toBeFocused();
  });

  test("Enter on a chapter goes there and closes the menu", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await page.goto("/en/03");
    await page.getByTestId("chapter-toggle").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/04$/);
    await expect(card(page)).toBeHidden();
    await expect(page.getByTestId("chapter-toggle")).toContainText("Ch 04");
  });

  test("closes on an outside click", async ({ page }) => {
    await page.goto("/en/02");
    await page.getByTestId("chapter-toggle").click();
    await expect(card(page)).toBeVisible();
    await page.mouse.click(10, page.viewportSize()!.height - 10);
    await expect(card(page)).toBeHidden();
  });

  test("closes when focus tabs out of it", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await page.goto("/en/02");
    await page.getByTestId("chapter-toggle").click();
    for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
    await expect(card(page)).toBeHidden();
  });

  test("on a phone, every row is a full-size touch target", async ({ page, isMobile }) => {
    test.skip(!isMobile, "touch");
    await page.goto("/hi/01");
    await page.getByTestId("chapter-toggle").click();
    for (const link of await card(page).getByRole("link").all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const menu = (await card(page).boundingBox())!;
    expect(menu.x).toBeGreaterThanOrEqual(0);
    expect(menu.x + menu.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});

test.describe("language menu", () => {
  test("names the current language and offers both, with a check on the active one", async ({ page, isMobile }) => {
    await page.goto("/en/05");
    const trigger = page.getByTestId("lang-toggle");
    await expect(trigger).toHaveAccessibleName(/English/);
    if (!isMobile) await expect(trigger).toContainText("English");
    await trigger.click();
    await expect(page.getByRole("menu")).toBeVisible();
    const items = page.getByRole("menuitemradio");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toHaveText("English");
    await expect(items.nth(1)).toHaveText("हिंदी (Hindi)");
    await expect(page.getByTestId("lang-en")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("lang-en").locator(".check")).toBeVisible();
    await expect(page.getByTestId("lang-hi").locator(".check")).toBeHidden();
  });

  test("switches language on the same chapter and keeps the menu honest", async ({ page }) => {
    await page.goto("/en/05");
    await switchLanguage(page, "hi");
    await expect(page).toHaveURL(/\/hi\/05$/);
    await expect(page.getByTestId("lang-toggle")).toHaveAccessibleName(/हिंदी/);
    await expect(page.getByTestId("lang-hi")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("choosing the current language just closes the menu", async ({ page }) => {
    await page.goto("/en/02");
    await switchLanguage(page, "en");
    await expect(page).toHaveURL(/\/en\/02$/);
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("the keyboard works, and Escape returns focus", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await page.goto("/en/07");
    await page.getByTestId("lang-toggle").focus();
    await page.keyboard.press("Enter");
    expect(await focused(page), "starts on the active language").toContain("English");
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toContain("हिंदी");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(page.getByTestId("lang-toggle")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/hi\/07$/);
  });

  test("opening one menu closes the other", async ({ page }) => {
    await page.goto("/en/02");
    await page.getByTestId("chapter-toggle").click();
    await expect(card(page)).toBeVisible();
    await page.getByTestId("lang-toggle").click();
    await expect(card(page)).toBeHidden();
    await expect(page.getByRole("menu")).toBeVisible();
  });
});

test.describe("theme", () => {
  test("is an icon button with a name, beside the language menu", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/en/03");
    const theme = page.getByTestId("theme-toggle");
    await expect(theme).toHaveAccessibleName("Toggle theme");
    await expect(theme.locator("svg")).toBeVisible();
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test("the menus sit above the scene, not under it", async ({ page }) => {
  await page.goto("/en/04");
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 3, behavior: "instant" }));
  await page.getByTestId("chapter-toggle").click();
  const link = card(page).getByRole("link").last();
  const b = (await link.boundingBox())!;
  const topmost = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x, y)?.closest(".menu-card") !== null,
    [b.x + b.width / 2, b.y + b.height / 2],
  );
  expect(topmost).toBe(true);
});
