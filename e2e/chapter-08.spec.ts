import { expect, test, type Page } from "@playwright/test";
import { formatRupees } from "../src/lib/hud-store";
import { sipSummary, sipValue } from "../src/lib/sip";
import { BEAT_MONTH, MONTHLY_STOPS, YEAR_STOPS } from "../src/scenes/chapter-08/story";
import { hud, open, scene, scrollToPct, visibleBeats } from "./helpers";

const mid = (beat: number) => ((beat + 0.5) / 7) * 100;
const money = (n: number) => formatRupees(Math.round(n));
const number = (s: string) => Number(s.replace(/[₹,]/g, ""));

const readChart = (page: Page) =>
  page.evaluate(() => {
    const on = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0.5;
    };
    const q = (id: string) => document.querySelector(`[data-testid=${id}]`)!;
    return {
      reveal: Number(q("reveal").getAttribute("width")),
      putIn: q("read-put-in").textContent,
      value: q("read-value").textContent,
      chartOn: on(q("sip-chart")),
      calcOn: on(q("calc")),
    };
  });

const readCalc = async (page: Page) => ({
  putIn: await page.getByTestId("calc-put-in").textContent(),
  growth: await page.getByTestId("calc-growth").textContent(),
  value: await page.getByTestId("calc-value").textContent(),
});

const fromEngine = (monthly: number, years: number) => {
  const { putIn, growth, value } = sipSummary(monthly, years);
  return { putIn: money(putIn), growth: money(growth), value: money(value) };
};

const STOPS = [
  { beat: 0, en: "₹2,000 a month. That is it." },
  { beat: 1, en: "Year 1. Nothing happens." },
  { beat: 2, en: "Year 3. Still nothing much." },
  { beat: 3, en: "Year 5. The grey is still doing the work." },
  { beat: 4, en: "Year 8. The line starts to lift." },
  { beat: 5, en: "Year 10. About ₹3,99,728." },
];

test.describe("Chapter 08 scroll stops", () => {
  test("the chart and HUD climb monotonically to ₹3,99,728", async ({ page }) => {
    await open(page, "/en/08");
    let lastHud = 0;
    let lastReveal = -1;

    for (const { beat, en } of STOPS) {
      await scrollToPct(page, mid(beat));
      await expect.poll(() => visibleBeats(page), `beat ${beat}`).toEqual([en]);
      const month = BEAT_MONTH[beat];
      const expected = money(sipValue(2000, month));
      await expect.poll(async () => (await hud(page)).value, `HUD at beat ${beat}`).toBe(expected);

      const h = await hud(page);
      expect(h.label).toBe("Your SIP");
      expect(h.note).toBe(`${money(2000 * month)} put in`);

      const chart = await readChart(page);
      expect(chart.value).toBe(expected);
      expect(chart.putIn).toBe(money(2000 * month));
      expect(chart.reveal).toBeCloseTo((month / 120) * 640, 0);
      expect(chart.reveal).toBeGreaterThan(lastReveal);
      expect(number(h.value)).toBeGreaterThan(lastHud);
      lastHud = number(h.value);
      lastReveal = chart.reveal;
    }
    expect(lastHud).toBe(399728);
  });

  test("the HUD never dips at any point on the way", async ({ page }) => {
    await open(page, "/en/08");
    let last = 0;
    for (let pct = 2; pct <= 98; pct += 4) {
      await scrollToPct(page, pct);
      const value = number((await hud(page)).value);
      expect(value, `at ${pct}%`).toBeGreaterThanOrEqual(last);
      last = value;
    }
  });

  test("it ends higher than any earlier chapter", async ({ page }) => {
    await open(page, "/en/08");
    await scrollToPct(page, 97);
    await expect.poll(async () => number((await hud(page)).value)).toBeGreaterThan(6128);
  });

  test("the growth layer starts invisible and ends large", async ({ page }) => {
    await open(page, "/en/08");
    const heightAt = (month: number) => (sipValue(2000, month) - 2000 * month) / sipValue(2000, 120);
    expect(heightAt(12)).toBeLessThan(0.01);
    expect(heightAt(120)).toBeGreaterThan(0.39);
    await expect(page.getByTestId("area-growth")).toBeAttached();
    await expect(page.getByTestId("area-principal")).toBeAttached();
  });

  test("scrolling backwards rewinds the chart", async ({ page }) => {
    await open(page, "/en/08");
    await scrollToPct(page, mid(5));
    await expect.poll(async () => (await hud(page)).value).toBe("₹3,99,728");
    await scrollToPct(page, mid(0));
    await expect.poll(async () => (await hud(page)).value).toBe("₹2,000");
    expect((await readChart(page)).reveal).toBeCloseTo(5.3, 0);
  });
});

test.describe("the calculator", () => {
  async function toCalc(page: Page, path = "/en/08") {
    await open(page, path);
    await scrollToPct(page, 96);
    await expect.poll(async () => (await readChart(page)).calcOn).toBe(true);
    await expect(page.getByTestId("calc-monthly-slider")).toBeVisible();
  }

  test("starts on the story's own numbers", async ({ page }) => {
    await toCalc(page);
    expect(await readCalc(page)).toEqual(fromEngine(2000, 10));
    await expect(page.getByTestId("calc-monthly")).toHaveText("₹2,000");
    await expect(page.getByTestId("calc-years")).toHaveText("10 years");
    expect((await readChart(page)).chartOn).toBe(false);
  });

  test("the amount reaches ₹500 and ₹10,000 by keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await toCalc(page);
    await page.getByTestId("calc-monthly-slider").focus();
    await page.keyboard.press("Home");
    await expect(page.getByTestId("calc-monthly")).toHaveText("₹500");
    expect(await readCalc(page)).toEqual(fromEngine(500, 10));
    await page.keyboard.press("End");
    await expect(page.getByTestId("calc-monthly")).toHaveText("₹10,000");
    expect(await readCalc(page)).toEqual(fromEngine(10000, 10));
  });

  test("the horizon changes the numbers, and singular reads right", async ({ page }) => {
    await toCalc(page);
    const slider = page.getByTestId("calc-years-slider");
    await slider.fill("0");
    await expect(page.getByTestId("calc-years")).toHaveText("1 year");
    expect(await readCalc(page)).toEqual(fromEngine(2000, 1));
    await slider.fill(String(YEAR_STOPS.length - 1));
    await expect(page.getByTestId("calc-years")).toHaveText("30 years");
    expect(await readCalc(page)).toEqual(fromEngine(2000, 30));
    await expect(slider).toHaveAttribute("aria-valuetext", "30 years");
  });

  test("agrees with sip.ts across the amounts", async ({ page }) => {
    await toCalc(page);
    const slider = page.getByTestId("calc-monthly-slider");
    for (let i = 0; i < MONTHLY_STOPS.length; i += 3) {
      await slider.fill(String(i));
      await expect(page.getByTestId("calc-monthly")).toHaveText(money(MONTHLY_STOPS[i]));
      expect(await readCalc(page)).toEqual(fromEngine(MONTHLY_STOPS[i], 10));
    }
  });

  test("the largest result still fits its column", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await toCalc(page);
    await page.getByTestId("calc-monthly-slider").fill(String(MONTHLY_STOPS.length - 1));
    await page.getByTestId("calc-years-slider").fill(String(YEAR_STOPS.length - 1));
    await expect(page.getByTestId("calc-value")).toHaveText(money(sipValue(10000, 360)));
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll(".calc-grid > div")].map((cell) => {
        const value = cell.querySelector("dd")!;
        const range = document.createRange();
        range.selectNodeContents(value);
        return range.getBoundingClientRect().width - cell.getBoundingClientRect().width;
      }),
    );
    for (const excess of overflow) expect(excess).toBeLessThanOrEqual(0);
  });

  test("does not disturb the HUD", async ({ page }) => {
    await toCalc(page);
    await page.getByTestId("calc-monthly-slider").fill("0");
    await expect(page.getByTestId("calc-monthly")).toHaveText("₹500");
    expect((await hud(page)).value).toBe("₹3,99,728");
  });

  test("the disclaimer sits next to the numbers", async ({ page }) => {
    await toCalc(page);
    const disclaimer = page.getByTestId("calc-disclaimer");
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText("Illustration only");
    await expect(disclaimer).toContainText("past returns do not guarantee future ones");
    await expect(disclaimer).toContainText("subject to market risks");
    await expect(page.locator(".outro")).toContainText("No fund is named or recommended.");
  });
});

test("Hindi: same numbers, and the disclaimer is there", async ({ page }) => {
  await open(page, "/hi/08");
  await scrollToPct(page, mid(5));
  await expect.poll(() => visibleBeats(page)).toEqual(["साल 10। करीब ₹3,99,728।"]);
  await scrollToPct(page, 96);
  await expect(page.getByTestId("calc-disclaimer")).toBeVisible();
  await expect(page.getByTestId("calc-disclaimer")).toContainText("सिर्फ़ उदाहरण");
  await expect(page.getByTestId("calc-years")).toHaveText("10 साल");
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/08");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 5);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the finished chart, every beat, and a working calculator", async ({ page }) => {
    await open(page, "/en/08");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).value).toBe("₹3,99,728");
    const chart = await readChart(page);
    expect(chart.reveal).toBe(640);
    expect(chart.chartOn).toBe(true);
    expect(chart.calcOn).toBe(true);
    expect(await visibleBeats(page)).toHaveLength(7);
    await page.getByTestId("calc-monthly-slider").fill("0");
    await expect(page.getByTestId("calc-value")).toHaveText(money(sipValue(500, 120)));
  });
});
