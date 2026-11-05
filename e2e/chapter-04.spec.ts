import { expect, test, type Page } from "@playwright/test";
import { CUTS, ROWS, TRADE } from "../src/scenes/chapter-04/story";
import { hud, open, scene, scrollToPct, visibleBeats } from "./helpers";

const mid = (beat: number) => ((beat + 0.5) / 7) * 100;

/** Mid-beat stops: what must be true at each. Widths are checked against costs.ts. */
const STOPS = [
  { beat: 0, en: "Back to ₹2,000. Price frozen.", hud: "₹2,000", label: "Your money", bar: 1000, slices: [] as string[], rows: [] as string[] },
  { beat: 1, en: "You put ₹1,000 into one trade.", hud: "₹1,000.00", label: "This trade", bar: 1000, slices: [], rows: [] },
  { beat: 2, en: "₹10.00 to the broker.", hud: "₹990.00", label: "This trade", bar: 990, slices: ["brokerage"], rows: ["brokerage"] },
  { beat: 3, en: "₹23.60, in one flat bite.", hud: "₹966.40", label: "This trade", bar: 966.4, slices: ["brokerage", "dp"], rows: ["brokerage", "dp"] },
  { beat: 4, en: "₹2.00 to the government.", hud: "₹964.40", label: "This trade", bar: 964.4, slices: ["brokerage", "dp", "stt"], rows: ["brokerage", "dp", "stt"] },
  { beat: 5, en: "Four small cuts, ₹2.02 in all.", hud: "₹962.38", label: "This trade", bar: 962.375, slices: ["brokerage", "dp", "stt", "rest"], rows: ["brokerage", "dp", "stt", "gst", "stamp", "exchange", "sebi"] },
  { beat: 6, en: "The share did not move. You are down 3.76%.", hud: "₹962.38", label: "This trade", bar: 962.375, slices: ["brokerage", "dp", "stt", "rest"], rows: ["brokerage", "dp", "stt", "gst", "stamp", "exchange", "sebi", "total"] },
];

const readNote = (page: Page) =>
  page.evaluate(() => {
    const on = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0.5;
    };
    const svg = document.querySelector("[data-testid=note]")!.getBoundingClientRect();
    const width = (el: Element) => (el.getBoundingClientRect().width / svg.width) * 1000;
    const bar = document.querySelector("[data-testid=note-bar]")!;
    const slices = [...document.querySelectorAll("[data-slice]")].filter(on);
    return {
      bar: width(bar),
      barColour: getComputedStyle(bar).fill,
      slices: Object.fromEntries(slices.map((s) => [s.getAttribute("data-slice"), width(s)])),
      sliceColour: slices[0] ? getComputedStyle(slices[0]).fill : null,
      rows: [...document.querySelectorAll("[data-row]")].filter(on).map((r) => r.getAttribute("data-row")),
    };
  });

test.describe("Chapter 04 scroll stops", () => {
  test("every cut lands: bar, slices, receipt and HUD, down to ₹962.38", async ({ page }) => {
    await open(page, "/en/04");
    const seen: string[] = [];

    for (const stop of STOPS) {
      const pct = mid(stop.beat);
      await scrollToPct(page, pct);
      await expect.poll(() => visibleBeats(page), `beat at ${pct}%`).toEqual([stop.en]);
      await expect.poll(async () => (await hud(page)).value, `HUD at beat ${stop.beat}`).toBe(stop.hud);
      expect((await hud(page)).label).toBe(stop.label);

      const note = await readNote(page);
      expect(note.bar, `bar width at beat ${stop.beat}`).toBeCloseTo(stop.bar, 0);
      expect(Object.keys(note.slices).sort()).toEqual([...stop.slices].sort());
      for (const id of stop.slices) {
        const cut = CUTS.find((c) => c.id === id)!;
        // A slice's width is its rupees: 1 unit of the note is ₹1.
        expect(note.slices[id], `${id} to scale`).toBeCloseTo(cut.amount, 0);
      }
      const expectedSlices = stop.slices.reduce(
        (sum, id) => sum + CUTS.find((c) => c.id === id)!.amount,
        0,
      );
      expect(note.bar + expectedSlices, "bar plus slices is the whole note").toBeCloseTo(TRADE, 0);
      expect(note.rows.sort()).toEqual([...stop.rows].sort());
      seen.push(stop.hud);
    }

    expect(seen.at(-1)).toBe("₹962.38");
  });

  test("the receipt prints every charge, ending at ₹37.62", async ({ page }) => {
    await open(page, "/en/04");
    await scrollToPct(page, mid(6));
    await expect(page.getByTestId("amount-total")).toHaveText("₹37.62");
    await expect(page.getByTestId("amount-total")).toBeVisible();
    for (const [id, amount] of [
      ["brokerage", "₹10.00"],
      ["dp", "₹23.60"],
      ["stt", "₹2.00"],
      ["gst", "₹1.81"],
      ["stamp", "₹0.15"],
      ["exchange", "₹0.06"],
      ["sebi", "₹0.002"],
    ]) {
      await expect(page.getByTestId(`amount-${id}`)).toHaveText(amount);
    }
    await expect(page.getByTestId("beat").filter({ hasText: "you are down" })).toHaveCount(1);
    await expect(page.getByTestId("beat").last()).toContainText("₹962.38");
    await expect(page.getByTestId("beat").last()).toContainText("₹37.62");
  });

  test("the DP beat states the 2.36%", async ({ page }) => {
    await open(page, "/en/04");
    await scrollToPct(page, mid(3));
    await expect(page.getByTestId("beat").nth(3)).toBeVisible();
    await expect(page.getByTestId("beat").nth(3)).toContainText("2.36%");
  });

  test("the kept money turns teal only at the end", async ({ page }) => {
    await open(page, "/en/04");
    await scrollToPct(page, mid(5));
    await page.waitForTimeout(350);
    const before = (await readNote(page)).barColour;
    await scrollToPct(page, mid(6));
    await expect.poll(async () => (await readNote(page)).barColour).not.toBe(before);
    const { sliceColour, barColour } = await readNote(page);
    expect(sliceColour).not.toBe(barColour);
  });

  test("scrolling backwards rebuilds the note", async ({ page }) => {
    await open(page, "/en/04");
    await scrollToPct(page, 96);
    await expect.poll(async () => (await hud(page)).value).toBe("₹962.38");
    await scrollToPct(page, mid(1));
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,000.00");
    const note = await readNote(page);
    expect(note.bar).toBeCloseTo(1000, 0);
    expect(note.slices).toEqual({});
    expect(note.rows).toEqual([]);
  });

  test("Hindi: same figures, Hindi copy", async ({ page }) => {
    await open(page, "/hi/04");
    await scrollToPct(page, mid(6));
    await expect.poll(async () => (await hud(page)).value).toBe("₹962.38");
    expect((await hud(page)).label).toBe("यह trade");
    await expect.poll(() => visibleBeats(page)).toEqual(["Share हिला तक नहीं। फिर भी आप 3.76% नीचे हैं।"]);
  });

  test("the receipt covers every row costs.ts produces", () => {
    expect(ROWS).toHaveLength(7);
  });
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/04");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 5);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("final state, every beat readable, HUD lands on ₹962.38", async ({ page }) => {
    await open(page, "/en/04");
    expect((await hud(page)).value).toBe("₹2,000");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).value).toBe("₹962.38");

    const note = await readNote(page);
    expect(note.bar).toBeCloseTo(962.4, 0);
    expect(Object.keys(note.slices)).toHaveLength(4);
    expect(note.rows).toHaveLength(8);
    expect(await visibleBeats(page)).toHaveLength(7);
    expect(await page.getByTestId("scene-sticky").evaluate((el) => getComputedStyle(el).position)).toBe("static");
  });
});
