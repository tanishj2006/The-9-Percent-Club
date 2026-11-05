import { expect, test, type Page } from "@playwright/test";
import { hud, open, scene, scrollToPct, visibleBeats } from "./helpers";

const mid = (beat: number) => ((beat + 0.5) / 8) * 100;

const readCurve = (page: Page) =>
  page.evaluate(() => {
    const on = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0.5;
    };
    const q = (id: string) => document.querySelector(`[data-testid=${id}]`)!;
    const sold = q("sold-line");
    return {
      crashOffset: Number(q("crash-line").getAttribute("stroke-dashoffset")),
      heldOffset: Number(q("held-line").getAttribute("stroke-dashoffset")),
      soldLength: Number(sold.getAttribute("x2")) - Number(sold.getAttribute("x1")),
      crashOn: on(q("crash-chart")),
      fullOn: on(q("full-chart")),
      gateOn: on(q("gate")),
      tracksOn: on(q("tracks")),
      held: q("track-held").textContent,
      sold: q("track-sold").textContent,
    };
  });

const money = (s: string) => Number(s.replace(/[₹,]/g, ""));

async function toGate(page: Page, path = "/en/06") {
  await open(page, path);
  await scrollToPct(page, mid(3));
  await expect(page.getByTestId("choose-sell")).toBeVisible();
}

test.describe("Chapter 06 scroll stops", () => {
  test("the crash draws, the HUD falls to ₹1,439.60, then the gate opens", async ({ page }) => {
    await open(page, "/en/06");

    await scrollToPct(page, mid(0));
    await expect.poll(() => visibleBeats(page)).toEqual(["₹2,000, in 49 large companies."]);
    expect((await hud(page)).value).toBe("₹2,000");
    expect((await readCurve(page)).crashOffset).toBe(1);

    await scrollToPct(page, mid(1));
    await expect.poll(() => visibleBeats(page)).toEqual(["It starts as a bad week."]);
    const part = await readCurve(page);
    expect(part.crashOffset).toBeGreaterThan(0.1);
    expect(part.crashOffset).toBeLessThan(0.95);
    const partway = money((await hud(page)).value);
    expect(partway).toBeLessThan(2000);
    expect(partway).toBeGreaterThan(1439.6);

    await scrollToPct(page, mid(3));
    await expect.poll(() => visibleBeats(page)).toEqual(["Hold or sell?"]);
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,439.60");
    await expect(page.getByTestId("hud")).toHaveAttribute("data-tone", "down");
    expect((await hud(page)).note).toBe("");
    const bottom = await readCurve(page);
    expect(bottom.crashOffset).toBeCloseTo(0, 5);
    expect(bottom.gateOn).toBe(true);
    expect(bottom.crashOn).toBe(true);
    expect(bottom.fullOn).toBe(false);
  });

  test("the fall beat states 28.02% in 42 days", async ({ page }) => {
    await open(page, "/en/06");
    await scrollToPct(page, mid(2));
    await expect.poll(() => visibleBeats(page)).toEqual(["In 42 days, 28.02% is gone."]);
    await expect(page.getByTestId("beat").nth(2)).toContainText("₹1,439.60");
  });

  test("without a choice the story still moves: both tracks draw", async ({ page }) => {
    await open(page, "/en/06");

    await scrollToPct(page, mid(4));
    await expect.poll(() => visibleBeats(page)).toEqual(["136 days later, the line was back."]);
    await expect.poll(async () => money((await hud(page)).value)).toBeGreaterThanOrEqual(2000);
    const recovered = await readCurve(page);
    expect(recovered.fullOn).toBe(true);
    expect(recovered.crashOn).toBe(false);
    expect(recovered.gateOn).toBe(false);
    expect(recovered.tracksOn).toBe(true);
    expect(recovered.heldOffset).toBeLessThan(1);
    expect(recovered.heldOffset).toBeGreaterThan(0.5);
    expect(recovered.soldLength).toBeGreaterThan(0);

    await scrollToPct(page, mid(5));
    await expect.poll(async () => (await hud(page)).value).toBe("₹6,128.17");
    const end = await readCurve(page);
    expect(end.heldOffset).toBeCloseTo(0, 5);
    expect(end.held).toBe("₹6,128");
    expect(end.sold).toBe("₹1,440");
    expect(end.soldLength).toBeGreaterThan(500);
    expect((await hud(page)).note).toBe("if sold: ₹1,440");
    await expect(page.getByTestId("hud")).toHaveAttribute("data-tone", "up");
  });

  test("the climb beat quotes more than 325% from the bottom", async ({ page }) => {
    await open(page, "/en/06");
    await scrollToPct(page, mid(5));
    await expect.poll(() => visibleBeats(page)).toEqual(["More than 325% above the bottom."]);
  });

  test("scrolling backwards undraws everything", async ({ page }) => {
    await open(page, "/en/06");
    await scrollToPct(page, 97);
    await expect.poll(async () => (await hud(page)).value).toBe("₹6,128.17");
    await scrollToPct(page, mid(0));
    await expect.poll(async () => (await hud(page)).value).toBe("₹2,000");
    const start = await readCurve(page);
    expect(start.crashOffset).toBe(1);
    expect(start.heldOffset).toBe(1);
    expect(start.soldLength).toBe(0);
    expect(start.crashOn).toBe(true);
    expect(start.tracksOn).toBe(false);
  });
});

test.describe("Hold or sell", () => {
  test("nothing is chosen until the reader chooses", async ({ page }) => {
    await toGate(page);
    await expect(page.getByTestId("choose-sell")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("choose-hold")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("choose-sell")).toContainText("₹1,440");
  });

  test("Sell keeps the HUD at the bottom, with the held track in its note", async ({ page }) => {
    await toGate(page);
    await page.getByTestId("choose-sell").click();
    await expect(page.getByTestId("choose-sell")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("choose-hold")).toHaveAttribute("aria-pressed", "false");

    await scrollToPct(page, mid(6));
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,439.60");
    expect((await hud(page)).note).toBe("if held: ₹6,128");
    await expect(page.getByTestId("hud")).toHaveAttribute("data-tone", "down");
    await expect(page.getByTestId("tracks")).toHaveAttribute("data-choice", "sold");
    await expect(page.getByTestId("tracks")).toContainText("You sold at the bottom");
    expect((await readCurve(page)).heldOffset).toBeCloseTo(0, 5);
  });

  test("Hold follows the curve up, with the sold track in its note", async ({ page }) => {
    await toGate(page);
    await page.getByTestId("choose-hold").click();
    await scrollToPct(page, mid(6));
    await expect.poll(async () => (await hud(page)).value).toBe("₹6,128.17");
    expect((await hud(page)).note).toBe("if sold: ₹1,440");
    await expect(page.getByTestId("tracks")).toHaveAttribute("data-choice", "held");
    await expect(page.getByTestId("tracks")).toContainText("You stayed invested");
  });

  test("the choice can be changed, and the HUD follows immediately", async ({ page }) => {
    await toGate(page);
    await page.getByTestId("choose-sell").click();
    await page.getByTestId("choose-hold").click();
    await expect(page.getByTestId("choose-sell")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("choose-hold")).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("choose-sell").click();
    await scrollToPct(page, mid(6));
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,439.60");
    await scrollToPct(page, mid(3));
    await page.getByTestId("choose-hold").click();
    await scrollToPct(page, mid(6));
    await expect.poll(async () => (await hud(page)).value).toBe("₹6,128.17");
  });

  test("clicking does not move the page or stop the scroll", async ({ page }) => {
    await toGate(page);
    const y = await page.evaluate(() => window.scrollY);
    await page.getByTestId("choose-sell").click();
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    await scrollToPct(page, mid(7));
    await expect.poll(() => visibleBeats(page)).toEqual(["This is one crash, not a rule."]);
  });

  test("the keyboard can decide", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard");
    await toGate(page);
    await page.getByTestId("choose-hold").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("choose-hold")).toHaveAttribute("aria-pressed", "true");
  });

  test("the buttons cannot be focused once the gate has passed", async ({ page }) => {
    await open(page, "/en/06");
    await scrollToPct(page, mid(5));
    await expect.poll(async () => (await readCurve(page)).gateOn).toBe(false);
    await expect(page.getByTestId("choose-sell")).toBeHidden();
  });
});

test.describe("honesty", () => {
  test("no company is named, and the caveat is on the page", async ({ page }) => {
    await open(page, "/en/06");
    await expect(page.locator("body")).not.toContainText(/adani/i);
    await expect(page.getByTestId("beat").last()).toContainText("It is not that holding always wins.");
    await expect(page.locator(".outro")).toContainText("Past prices say nothing about future ones.");
  });
});

test("Hindi: same figures, Hindi copy", async ({ page }) => {
  await toGate(page, "/hi/06");
  await expect.poll(() => visibleBeats(page)).toEqual(["रुकें या बेचें?"]);
  expect((await hud(page)).value).toBe("₹1,439.60");
  await page.getByTestId("choose-sell").click();
  await scrollToPct(page, mid(6));
  await expect.poll(async () => (await hud(page)).note).toBe("रुकते तो: ₹6,128");
});

test("a language swap keeps the choice", async ({ page }) => {
  await toGate(page);
  await page.getByTestId("choose-sell").click();
  await page.getByTestId("lang-toggle").click();
  await expect(page).toHaveURL(/\/hi\/06$/);
  await expect(page.getByTestId("choose-sell")).toHaveAttribute("aria-pressed", "true");
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/06");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 6);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the full curve, every beat, and a working choice", async ({ page }) => {
    await open(page, "/en/06");
    expect((await hud(page)).value).toBe("₹2,000");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).value).toBe("₹6,128.17");

    const curve = await readCurve(page);
    expect(curve.heldOffset).toBeCloseTo(0, 5);
    expect(curve.fullOn).toBe(true);
    expect(curve.tracksOn).toBe(true);
    expect(await visibleBeats(page)).toHaveLength(8);

    await page.getByTestId("choose-sell").click();
    await expect.poll(async () => (await hud(page)).value).toBe("₹1,439.60");
    await page.getByTestId("choose-hold").click();
    await expect.poll(async () => (await hud(page)).value).toBe("₹6,128.17");
  });
});
