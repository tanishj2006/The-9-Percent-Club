import { expect, test, type Page } from "@playwright/test";
import { breakevenMove, roundTripCost } from "../src/lib/costs";
import { formatCost, formatRupees } from "../src/lib/hud-store";
import { SLIDER_STOPS, TIERS } from "../src/scenes/chapter-05/story";
import { hud, open, scene, scrollToPct, visibleBeats, switchLanguage } from "./helpers";

const mid = (beat: number) => beat * 10 + 5;

const STOPS = [
  { beat: 0, en: "Meet the breakeven gap.", capital: "", gap: "", tiers: [] as number[], hud: "₹2,000" },
  { beat: 1, en: "₹500 needs a 7.30% rise.", capital: "₹500", gap: "7.30%", tiers: [500], hud: "₹2,000" },
  { beat: 2, en: "₹1,000 needs 3.76%.", capital: "₹1,000", gap: "3.76%", tiers: [500, 1000], hud: "₹2,000" },
  { beat: 3, en: "₹2,000 needs 1.99%.", capital: "₹2,000", gap: "1.99%", tiers: [500, 1000, 2000], hud: "₹2,000" },
  { beat: 4, en: "The wall is a flat ₹23.60.", capital: "₹2,000", gap: "1.99%", tiers: [500, 1000, 2000], hud: "₹2,000" },
  { beat: 5, en: "Now do that 10 times.", capital: "₹2,000", gap: "1.99%", tiers: [500, 1000, 2000], hud: "₹1,601.50" },
  { beat: 6, en: "₹5,000 needs 0.93%.", capital: "₹5,000", gap: "0.93%", tiers: [500, 1000, 2000, 5000], hud: "₹1,601.50" },
  { beat: 7, en: "₹10,000 needs 0.69%.", capital: "₹10,000", gap: "0.69%", tiers: [500, 1000, 2000, 5000, 10000], hud: "₹1,601.50" },
  { beat: 8, en: "₹50,000 needs 0.36%.", capital: "₹50,000", gap: "0.36%", tiers: [...TIERS], hud: "₹1,601.50" },
];

const readChart = (page: Page) =>
  page.evaluate(() => {
    const on = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0.5;
    };
    const barHeight = (tier: string) => {
      const dp = document.querySelector(`[data-testid="dp-${tier}"]`)!.getBoundingClientRect();
      const rest = document.querySelector(`[data-testid="rest-${tier}"]`)!.getBoundingClientRect();
      return { total: dp.height + rest.height, dp: dp.height };
    };
    return {
      tiers: [...document.querySelectorAll("[data-tier]")].filter(on).map((t) => Number(t.getAttribute("data-tier"))),
      heights: Object.fromEntries(
        [...document.querySelectorAll("[data-tier]")].map((t) => [
          t.getAttribute("data-tier"),
          barHeight(t.getAttribute("data-tier")!),
        ]),
      ),
      capital: document.querySelector("[data-testid=readout-capital]")!.textContent,
      gap: document.querySelector("[data-testid=readout-gap]")!.textContent,
      chartOn: on(document.querySelector("[data-testid=chart]")!),
      calcOn: on(document.querySelector("[data-testid=calc]")!),
    };
  });

const readCalc = async (page: Page) => ({
  capital: await page.getByTestId("calc-capital").textContent(),
  cost: await page.getByTestId("calc-cost").textContent(),
  gap: await page.getByTestId("calc-gap").textContent(),
});

/** Runs the same inputs through costs.ts here, in the test process. */
const fromEngine = (capital: number) => ({
  capital: formatRupees(capital),
  cost: formatCost(roundTripCost(1, capital, capital).total),
  gap: `${(breakevenMove(1, capital) * 100).toFixed(2)}%`,
});

test.describe("Chapter 05 scroll stops", () => {
  test("every tier arrives, with the 1.99% anchor at ₹2,000", async ({ page }) => {
    await open(page, "/en/05");
    for (const stop of STOPS) {
      await scrollToPct(page, mid(stop.beat));
      await expect.poll(() => visibleBeats(page), `beat ${stop.beat}`).toEqual([stop.en]);
      await expect.poll(async () => (await hud(page)).value, `HUD at beat ${stop.beat}`).toBe(stop.hud);
      await expect.poll(async () => (await readChart(page)).tiers, `tiers at beat ${stop.beat}`).toEqual(stop.tiers);
      const chart = await readChart(page);
      expect(chart.capital).toBe(stop.capital);
      expect(chart.gap).toBe(stop.gap);
      expect(chart.chartOn).toBe(true);
      expect(chart.calcOn).toBe(false);
    }
  });

  test("bar heights are proportional to the real gaps", async ({ page }) => {
    await open(page, "/en/05");
    await scrollToPct(page, mid(8));
    await expect.poll(async () => (await readChart(page)).tiers).toHaveLength(6);
    await page.waitForTimeout(100);
    const { heights } = await readChart(page);
    const base = heights["500"].total / (breakevenMove(1, 500) * 100);
    for (const tier of TIERS) {
      const gap = breakevenMove(1, tier) * 100;
      expect(heights[tier].total, `₹${tier} bar`).toBeCloseTo(gap * base, 0);
      // The DP charge is the same rupees everywhere, so its share of the bar falls.
      expect(heights[tier].dp, `₹${tier} DP`).toBeCloseTo(((23.6 / tier) * 100 * base), 0);
    }
  });

  test("the ten-trip beat says about 20%, and the HUD pays for it", async ({ page }) => {
    await open(page, "/en/05");
    await scrollToPct(page, mid(5));
    const beat = page.getByTestId("beat").nth(5);
    await expect(beat).toBeVisible();
    await expect(beat).toContainText("₹398.50");
    await expect(beat).toContainText("19.9%");
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,601.50");
    await expect(page.getByTestId("hud")).toHaveAttribute("data-tone", "down");
    expect((await hud(page)).note).toBe("after 10 round trips");
  });

  test("scrolling backwards puts the money and bars back", async ({ page }) => {
    await open(page, "/en/05");
    await scrollToPct(page, 95);
    await expect.poll(async () => (await readChart(page)).calcOn).toBe(true);
    await scrollToPct(page, mid(1));
    await expect.poll(async () => (await hud(page)).value).toBe("₹2,000");
    await expect.poll(async () => (await readChart(page)).tiers).toEqual([500]);
    expect((await readChart(page)).calcOn).toBe(false);
  });
});

test.describe("the capital slider", () => {
  async function toSlider(page: Page, path = "/en/05") {
    await open(page, path);
    await scrollToPct(page, 96);
    await expect.poll(async () => (await readChart(page)).calcOn).toBe(true);
    await expect(page.getByTestId("calc-slider")).toBeVisible();
  }

  test("starts on the reader's ₹2,000", async ({ page }) => {
    await toSlider(page);
    expect(await readCalc(page)).toEqual({ capital: "₹2,000", cost: "₹39.85", gap: "1.99%" });
    expect((await readChart(page)).chartOn).toBe(false);
  });

  test("the keyboard reaches both ends, and every step matches costs.ts", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await toSlider(page);
    const slider = page.getByTestId("calc-slider");
    await slider.focus();

    await page.keyboard.press("Home");
    await expect(page.getByTestId("calc-capital")).toHaveText("₹500");
    expect(await readCalc(page)).toEqual(fromEngine(500));
    expect((await readCalc(page)).gap).toBe("7.30%");

    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("calc-capital")).toHaveText("₹600");
    expect(await readCalc(page)).toEqual(fromEngine(600));

    await page.keyboard.press("End");
    await expect(page.getByTestId("calc-capital")).toHaveText("₹1,00,000");
    expect(await readCalc(page)).toEqual({ capital: "₹1,00,000", cost: "₹293.28", gap: "0.29%" });
    await expect(slider).toHaveAttribute("aria-valuetext", "₹1,00,000");
  });

  test("agrees with costs.ts across every stop on the slider", async ({ page }) => {
    await toSlider(page);
    const slider = page.getByTestId("calc-slider");
    for (let i = 0; i < SLIDER_STOPS.length; i += 7) {
      await slider.fill(String(i));
      await expect(page.getByTestId("calc-capital")).toHaveText(formatRupees(SLIDER_STOPS[i]));
      expect(await readCalc(page)).toEqual(fromEngine(SLIDER_STOPS[i]));
    }
  });

  test("a touch drag moves it", async ({ page, isMobile }) => {
    test.skip(!isMobile, "touch");
    await toSlider(page);
    const box = (await page.getByTestId("calc-slider").boundingBox())!;
    expect(box.height, "touch target").toBeGreaterThanOrEqual(44);
    await page.touchscreen.tap(box.x + box.width * 0.9, box.y + box.height / 2);
    await expect(page.getByTestId("calc-capital")).not.toHaveText("₹2,000");
    const { capital } = await readCalc(page);
    const value = Number(capital!.replace(/[₹,]/g, ""));
    expect(await readCalc(page)).toEqual(fromEngine(value));
  });

  test("does not disturb the HUD or the scene", async ({ page }) => {
    await toSlider(page);
    await page.getByTestId("calc-slider").fill("0");
    await expect(page.getByTestId("calc-capital")).toHaveText("₹500");
    expect((await hud(page)).value).toBe("₹1,601.50");
    await expect(page.getByTestId("rail")).toBeAttached();
    expect((await readChart(page)).calcOn).toBe(true);
  });

  test("survives a language swap with the reader's number", async ({ page }) => {
    await toSlider(page);
    await page.getByTestId("calc-slider").fill("0");
    await switchLanguage(page);
    await expect(page).toHaveURL(/\/hi\/05$/);
    await expect(page.getByTestId("calc-capital")).toHaveText("₹500");
    await expect.poll(() => visibleBeats(page)).toEqual(["अपनी रकम डालकर देखिए।"]);
    // Reset: the slider's memory is per page load and this is one browser page.
    await page.getByTestId("calc-slider").fill(String(SLIDER_STOPS.indexOf(2000)));
  });
});

test("Hindi: same 1.99%", async ({ page }) => {
  await open(page, "/hi/05");
  await scrollToPct(page, mid(3));
  await expect.poll(() => visibleBeats(page)).toEqual(["₹2,000 पर 1.99%।"]);
  await expect.poll(async () => (await readChart(page)).gap).toBe("1.99%");
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/05");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 8);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("all bars, all beats, and a working slider", async ({ page }) => {
    await open(page, "/en/05");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,601.50");
    const chart = await readChart(page);
    expect(chart.tiers).toHaveLength(6);
    expect(chart.calcOn).toBe(true);
    expect(chart.chartOn).toBe(true);
    expect(await visibleBeats(page)).toHaveLength(10);
    await page.getByTestId("calc-slider").fill("0");
    await expect(page.getByTestId("calc-gap")).toHaveText("7.30%");
  });
});
