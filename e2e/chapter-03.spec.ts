import { expect, test, type Page } from "@playwright/test";
import { hud, open, scene, scrollToPct, visibleBeats } from "./helpers";

const mid = (beat: number) => ((beat + 0.5) / 7) * 100;

const readDay = (page: Page) =>
  page.evaluate(() => {
    const on = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0.5;
    };
    const q = (id: string) => document.querySelector(`[data-testid=${id}]`)!;
    const n = (id: string, attr: string) => Number(q(id).getAttribute(attr));
    return {
      lineOffset: n("day-line", "stroke-dashoffset"),
      wickTop: n("candle-wick", "y1"),
      wickBottom: n("candle-wick", "y2"),
      bodyTop: n("candle-body", "y"),
      bodyHeight: n("candle-body", "height"),
      colour: q("candle").getAttribute("class"),
      open: q("ohlc-open").textContent,
      high: q("ohlc-high").textContent,
      low: q("ohlc-low").textContent,
      close: q("ohlc-close").textContent,
      clock: q("clock").textContent,
      clockX: n("clock", "x"),
      dayOn: on(q("day-chart")),
      rowOn: on(q("row-chart")),
      redOn: on(q("red-candle")),
      candles: document.querySelectorAll("[data-candle]").length,
    };
  });

const number = (s: string) => Number(s.replace(/[₹,]/g, ""));

test.describe("Chapter 03 scroll stops", () => {
  test("the line draws and builds open, low, high, close", async ({ page }) => {
    await open(page, "/en/03");

    await scrollToPct(page, mid(0));
    await expect.poll(() => visibleBeats(page)).toEqual(["The market opens at ₹100."]);
    let day = await readDay(page);
    expect(day).toMatchObject({ open: "₹100", low: "—", high: "—", close: "—", clock: "9:15" });
    expect(day.lineOffset).toBe(1);
    expect(day.wickBottom - day.wickTop, "no wick yet").toBe(0);
    expect((await hud(page)).value).toBe("₹2,000");
    expect((await hud(page)).note).toBe("10 shares at ₹100");

    await scrollToPct(page, mid(1));
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,960");
    day = await readDay(page);
    expect(day).toMatchObject({ low: "₹96", high: "—", close: "—", colour: "candle-down" });
    expect(day.lineOffset).toBeLessThan(1);
    const lowLine = day.lineOffset;
    const wickBottom = day.wickBottom;

    await scrollToPct(page, mid(2));
    await expect.poll(async () => (await hud(page)).value).toBe("₹2,060");
    day = await readDay(page);
    expect(day).toMatchObject({ low: "₹96", high: "₹106", close: "—", colour: "candle-up" });
    expect(day.lineOffset).toBeLessThan(lowLine);
    expect(day.wickBottom, "the low stays recorded").toBe(wickBottom);
    const wickTop = day.wickTop;

    await scrollToPct(page, mid(3));
    await expect.poll(async () => (await hud(page)).value).toBe("₹2,030");
    day = await readDay(page);
    expect(day).toMatchObject({ open: "₹100", high: "₹106", low: "₹96", close: "₹103", clock: "3:30", colour: "candle-up" });
    expect(day.clockX, "the clock follows the line").toBeGreaterThan(400);
    expect(day.lineOffset).toBeCloseTo(0, 5);
    expect(day.wickTop, "the high stays recorded").toBe(wickTop);
    expect(day.wickBottom).toBe(wickBottom);
    // The body is only open to close, so the wicks stick out both ends.
    expect(day.bodyTop).toBeGreaterThan(wickTop);
    expect(day.bodyTop + day.bodyHeight).toBeLessThan(wickBottom);
    expect(day.bodyHeight, "₹3 is 30% of the ₹10 range").toBeCloseTo((wickBottom - wickTop) * 0.3, 0);
  });

  test("the HUD dips and recovers with the shares", async ({ page }) => {
    await open(page, "/en/03");
    const seen: number[] = [];
    for (const beat of [0, 1, 2, 3]) {
      await scrollToPct(page, mid(beat));
      await page.waitForTimeout(50);
      seen.push(number((await hud(page)).value));
    }
    expect(seen).toEqual([2000, 1960, 2060, 2030]);
  });

  test("a red day appears beside yours", async ({ page }) => {
    await open(page, "/en/03");
    await scrollToPct(page, mid(3));
    expect((await readDay(page)).redOn).toBe(false);
    await scrollToPct(page, mid(4));
    await expect.poll(async () => (await readDay(page)).redOn).toBe(true);
    await expect.poll(() => visibleBeats(page)).toEqual(["Close lower, and the candle turns."]);
  });

  test("zooms out to a row of 20 candles", async ({ page }) => {
    await open(page, "/en/03");
    await scrollToPct(page, mid(5));
    await expect.poll(async () => (await readDay(page)).rowOn).toBe(true);
    const day = await readDay(page);
    expect(day.dayOn).toBe(false);
    expect(day.candles).toBe(20);
    await expect(page.getByTestId("beat").nth(5)).toContainText("all invented");
  });

  test("the last beat says what a chart cannot do", async ({ page }) => {
    await open(page, "/en/03");
    await scrollToPct(page, mid(6));
    await expect.poll(() => visibleBeats(page)).toEqual(["A diary cannot read the future."]);
    await expect(page.getByTestId("beat").last()).toContainText("what the trade cost you");
  });

  test("scrolling backwards unwinds the candle", async ({ page }) => {
    await open(page, "/en/03");
    await scrollToPct(page, 97);
    await expect.poll(async () => (await readDay(page)).rowOn).toBe(true);
    await scrollToPct(page, mid(0));
    await expect.poll(async () => (await readDay(page)).close).toBe("—");
    const day = await readDay(page);
    expect(day.lineOffset).toBe(1);
    expect(day.wickBottom - day.wickTop).toBe(0);
    expect(day.dayOn).toBe(true);
    expect(day.rowOn).toBe(false);
    expect(day.redOn).toBe(false);
    expect((await hud(page)).value).toBe("₹2,000");
  });
});

test("Hindi: same day", async ({ page }) => {
  await open(page, "/hi/03");
  await scrollToPct(page, mid(3));
  await expect.poll(() => visibleBeats(page)).toEqual(["दिन ₹103 पर बंद होता है।"]);
  await expect.poll(async () => (await hud(page)).note).toBe("10 share, ₹103 पर");
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/03");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 5);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the finished candle, the row, every beat", async ({ page }) => {
    await open(page, "/en/03");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).value).toBe("₹2,030");
    const day = await readDay(page);
    expect(day).toMatchObject({ open: "₹100", high: "₹106", low: "₹96", close: "₹103" });
    expect(day.lineOffset).toBeCloseTo(0, 5);
    expect(day.rowOn).toBe(true);
    expect(day.redOn).toBe(true);
    expect(await visibleBeats(page)).toHaveLength(7);
  });
});
