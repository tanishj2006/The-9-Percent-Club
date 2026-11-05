import { expect, test, type Page } from "@playwright/test";
import { lostAt } from "../src/scenes/chapter-07/story";
import { hud, open, scene, scrollToPct, visibleBeats } from "./helpers";

const mid = (beat: number) => ((beat + 0.5) / 8) * 100;

const readCrowd = (page: Page) =>
  page.evaluate(() => {
    const figures = [...document.querySelectorAll<SVGGElement>("[data-figure]")];
    const count = (state: string) => figures.filter((f) => f.dataset.state === state).length;
    const loss = document.querySelector("[data-testid=loss-figure]")!;
    const style = getComputedStyle(loss);
    const colourOf = (state: string) => {
      const f = figures.find((x) => x.dataset.state === state);
      return f ? getComputedStyle(f).fill : null;
    };
    return {
      total: figures.length,
      lit: count("lit"),
      lost: count("lost"),
      kept: count("kept"),
      readout: Number(document.querySelector("[data-testid=lost-count]")!.textContent),
      lossOn: style.visibility !== "hidden" && Number(style.opacity) > 0.5,
      lostColour: colourOf("lost"),
      keptColour: colourOf("kept"),
    };
  });

test.describe("Chapter 07 scroll stops", () => {
  test("100 marigold figures become 91 dimmed and 9 teal", async ({ page }) => {
    await open(page, "/en/07");
    await scrollToPct(page, mid(0));
    const start = await readCrowd(page);
    expect(start).toMatchObject({ total: 100, lit: 100, lost: 0, kept: 0, readout: 0 });
    await expect.poll(() => visibleBeats(page)).toEqual(["Picture 100 traders."]);

    await scrollToPct(page, mid(1));
    await expect.poll(() => visibleBeats(page)).toEqual(["SEBI counted."]);
    const partway = await readCrowd(page);
    expect(partway.lost).toBe(lostAt(mid(1) / 100));
    expect(partway.lost).toBeGreaterThan(5);
    expect(partway.lost).toBeLessThan(91);
    expect(partway.lit + partway.lost).toBe(100);
    expect(partway.readout).toBe(partway.lost);

    await scrollToPct(page, mid(2));
    await expect.poll(() => visibleBeats(page)).toEqual(["91 of them lost money."]);
    await expect.poll(async () => (await readCrowd(page)).lost).toBe(91);
    expect((await readCrowd(page)).lit).toBe(9);

    await scrollToPct(page, mid(3));
    await expect.poll(() => visibleBeats(page)).toEqual(["9 did not."]);
    await expect.poll(async () => (await readCrowd(page)).kept).toBe(9);
    const end = await readCrowd(page);
    expect(end).toMatchObject({ lit: 0, lost: 91, kept: 9, readout: 91 });
    await expect.poll(async () => (await readCrowd(page)).lostColour).not.toBe(end.keptColour);
  });

  test("₹1,05,603 crore arrives on its beat and is on the page", async ({ page }) => {
    await open(page, "/en/07");
    await scrollToPct(page, mid(5));
    await expect.poll(async () => (await readCrowd(page)).lost).toBe(91);
    expect((await readCrowd(page)).lossOn).toBe(false);

    await scrollToPct(page, mid(6));
    await expect.poll(() => visibleBeats(page)).toEqual(["₹1,05,603 crore."]);
    await expect(page.getByTestId("loss-figure")).toBeVisible();
    await expect(page.getByTestId("loss-figure")).toContainText("₹1,05,603 crore");
    await expect(page.getByTestId("loss-figure")).toContainText("FY25");
  });

  test("the HUD counts them while the reader's own ₹2,000 stays put", async ({ page }) => {
    await open(page, "/en/07");
    await scrollToPct(page, mid(3));
    await expect.poll(async () => (await hud(page)).note).toBe("91 of 100 lost");
    expect((await hud(page)).value).toBe("₹2,000");
  });

  test("scrolling backwards relights everyone", async ({ page }) => {
    await open(page, "/en/07");
    await scrollToPct(page, 97);
    await expect.poll(async () => (await readCrowd(page)).kept).toBe(9);
    await scrollToPct(page, mid(0));
    await expect.poll(async () => (await readCrowd(page)).lit).toBe(100);
    expect((await readCrowd(page)).lossOn).toBe(false);
    expect((await hud(page)).note).toBe("fresh start");
  });
});

test.describe("sourcing and tone", () => {
  test("the figures are dated, scoped to F&O, and the later revision is disclosed", async ({ page }) => {
    await open(page, "/en/07");
    const note = page.locator(".outro");
    await expect(note).toContainText("July 2025");
    await expect(note).toContainText("F&O only");
    await expect(note).toContainText("₹1.12 lakh crore");
    await expect(note).toContainText("87.7%");
    await expect(note).toContainText("₹91,685 crore");
    await expect(note).toContainText("September 2024");
  });

  test("it promises nothing", async ({ page }) => {
    await open(page, "/en/07");
    await expect(page.getByTestId("beat").nth(3)).toContainText("It is not a club with a way in");
    await expect(page.getByTestId("beat").last()).toContainText("nobody honest can promise");
    await expect(page.locator(".outro")).toContainText("It is not a strategy");
  });
});

test("Hindi: same count, same figure", async ({ page }) => {
  await open(page, "/hi/07");
  await scrollToPct(page, mid(6));
  await expect.poll(() => visibleBeats(page)).toEqual(["₹1,05,603 करोड़।"]);
  await expect(page.getByTestId("loss-figure")).toContainText("₹1,05,603 करोड़");
  expect((await readCrowd(page)).lost).toBe(91);
  expect((await hud(page)).note).toBe("100 में से 91 घाटे में");
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/07");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 6);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("final state with every beat readable", async ({ page }) => {
    await open(page, "/en/07");
    expect((await hud(page)).note).toBe("fresh start");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).note).toBe("91 of 100 lost");
    const crowd = await readCrowd(page);
    expect(crowd).toMatchObject({ lit: 0, lost: 91, kept: 9, lossOn: true, readout: 91 });
    expect(await visibleBeats(page)).toHaveLength(8);
  });
});
