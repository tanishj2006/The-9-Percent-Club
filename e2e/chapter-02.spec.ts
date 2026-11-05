import { expect, test, type Page } from "@playwright/test";
import { hud, open, scene, scrollToPct, visibleBeats } from "./helpers";

const mid = (beat: number) => ((beat + 0.5) / 7) * 100;

const readBook = (page: Page) =>
  page.evaluate(() => {
    const on = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0.5;
    };
    const prices = (side: string) =>
      [...document.querySelectorAll(`[data-side="${side}"]`)].filter(on).map((o) => Number(o.getAttribute("data-price")));
    const q = (id: string) => document.querySelector(`[data-testid=${id}]`)!;
    return {
      bids: prices("bid"),
      asks: prices("ask"),
      sellerOn: on(q("order-seller")),
      youOn: on(q("order-you")),
      ltp: q("ltp").textContent,
      spread: q("spread").textContent,
      bidColour: getComputedStyle(document.querySelector(".book-bid")!).fill,
      askColour: getComputedStyle(document.querySelector(".book-ask")!).fill,
      gapBetween: (() => {
        const [a, b] = [q("order-seller"), q("order-you")].map((el) => el.querySelector("rect")!.getBoundingClientRect());
        return Math.abs((a.left + a.right) / 2 - (b.left + b.right) / 2);
      })(),
    };
  });

test.describe("Chapter 02 scroll stops", () => {
  test("the book fills, stalls at the gap, then matches at ₹100", async ({ page }) => {
    await open(page, "/en/02");

    await scrollToPct(page, mid(0));
    await expect.poll(() => visibleBeats(page)).toEqual(["Nobody sets the price."]);
    let book = await readBook(page);
    expect(book.bids).toEqual([]);
    expect(book.asks).toEqual([]);
    expect(book.ltp).toBe("₹99.50");

    await scrollToPct(page, mid(1));
    await expect.poll(async () => (await readBook(page)).bids).toEqual([99.5, 99, 98]);
    expect((await readBook(page)).asks).toEqual([]);

    await scrollToPct(page, mid(2));
    await expect.poll(async () => (await readBook(page)).asks).toEqual([100.5, 101, 102]);

    await scrollToPct(page, mid(3));
    await expect.poll(() => visibleBeats(page)).toEqual(["Nothing trades across a gap."]);
    book = await readBook(page);
    expect(book.ltp, "nothing has traded").toBe("₹99.50");
    expect(book.spread).toBe("₹1.00");
    expect(book.sellerOn).toBe(false);
    expect((await hud(page)).note).toBe("with your broker");

    await scrollToPct(page, mid(4));
    await expect.poll(async () => (await readBook(page)).sellerOn).toBe(true);
    book = await readBook(page);
    expect(book.ltp, "still nothing has traded").toBe("₹99.50");
    expect(book.youOn).toBe(false);
    expect(book.spread).toBe("₹0.50");

    await scrollToPct(page, mid(5));
    await expect.poll(() => visibleBeats(page)).toEqual(["You buy 10 shares at ₹100."]);
    await expect.poll(async () => (await readBook(page)).ltp).toBe("₹100");
    await expect.poll(async () => (await hud(page)).note).toBe("₹1,000 in 10 shares");
    expect((await hud(page)).value).toBe("₹2,000");
    book = await readBook(page);
    expect(book.sellerOn, "both orders are used up").toBe(false);
    expect(book.youOn).toBe(false);
    expect(book.spread, "the gap reopens").toBe("₹1.00");
    expect(book.bids).toEqual([99.5, 99, 98]);
    expect(book.asks).toEqual([100.5, 101, 102]);
  });

  test("the two orders physically meet in the middle", async ({ page }) => {
    await open(page, "/en/02");
    await scrollToPct(page, (5 + 0.1) / 7 * 100);
    await expect.poll(async () => (await readBook(page)).youOn).toBe(true);
    const before = (await readBook(page)).gapBetween;
    await scrollToPct(page, (5 + 0.3) / 7 * 100);
    await expect.poll(async () => (await readBook(page)).gapBetween).toBeLessThan(before);
    // Their two price labels would collide in the middle, so they clear first.
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll("[data-match-label]")].map((el) => getComputedStyle(el).visibility),
    );
    expect(new Set(labels)).toEqual(new Set(["hidden"]));
  });

  test("buyers and sellers are different colours", async ({ page }) => {
    await open(page, "/en/02");
    const book = await readBook(page);
    expect(book.bidColour).not.toBe(book.askColour);
  });

  test("scrolling backwards unwinds the trade", async ({ page }) => {
    await open(page, "/en/02");
    await scrollToPct(page, 97);
    await expect.poll(async () => (await readBook(page)).ltp).toBe("₹100");
    await scrollToPct(page, mid(0));
    await expect.poll(async () => (await readBook(page)).ltp).toBe("₹99.50");
    const book = await readBook(page);
    expect(book.bids).toEqual([]);
    expect(book.asks).toEqual([]);
    expect((await hud(page)).note).toBe("with your broker");
  });

  test("it says the book is invented", async ({ page }) => {
    await open(page, "/en/02");
    await expect(page.locator(".outro")).toContainText("An invented order book");
  });
});

test("Hindi: same match", async ({ page }) => {
  await open(page, "/hi/02");
  await scrollToPct(page, mid(5));
  await expect.poll(() => visibleBeats(page)).toEqual(["आपने ₹100 पर 10 share खरीदे।"]);
  await expect.poll(async () => (await hud(page)).note).toBe("10 share में ₹1,000");
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/02");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 5);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the book at rest after the trade, every beat readable", async ({ page }) => {
    await open(page, "/en/02");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).note).toBe("₹1,000 in 10 shares");
    const book = await readBook(page);
    expect(book.ltp).toBe("₹100");
    expect(book.bids).toHaveLength(3);
    expect(book.asks).toHaveLength(3);
    expect(await visibleBeats(page)).toHaveLength(7);
  });
});
