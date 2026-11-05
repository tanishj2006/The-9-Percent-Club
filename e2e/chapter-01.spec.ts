import { expect, test, type Page } from "@playwright/test";
import { hud, open, scene, scrollToPct, visibleBeats } from "./helpers";

const mid = (beat: number) => ((beat + 0.5) / 7) * 100;

const readMap = (page: Page) =>
  page.evaluate(() => {
    const on = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0.5;
    };
    const box = (el: Element) => el.getBoundingClientRect();
    const touching = (a: Element, b: Element) => {
      const [p, q] = [box(a), box(b)];
      return p.left < q.right && p.right > q.left && p.top < q.bottom && p.bottom > q.top;
    };
    const money = document.querySelector("[data-testid=money-packet]")!;
    const share = document.querySelector("[data-testid=share-token]")!;
    const nodes = [...document.querySelectorAll("[data-node]")];
    const packetAt = (packet: Element) =>
      nodes.filter((n) => touching(packet, n.querySelector("rect")!)).map((n) => n.getAttribute("data-node"));
    return {
      lit: nodes.filter((n) => n.getAttribute("data-state") === "lit").map((n) => n.getAttribute("data-node")),
      legs: [...document.querySelectorAll("[data-leg-id]")].map((l) => Number(l.getAttribute("stroke-dashoffset"))),
      moneyOn: on(money),
      shareOn: on(share),
      moneyAt: packetAt(money),
      shareAt: packetAt(share),
    };
  });

const STOPS = [
  { beat: 0, en: "You cannot walk up to the counter.", lit: [] as string[], legs: [1, 1, 1], note: "fresh start" },
  { beat: 1, en: "It starts in your bank.", lit: ["phone"], legs: [1, 1, 1], note: "in your bank" },
  { beat: 2, en: "The broker is a doorway.", lit: ["phone", "broker"], legs: [0, 1, 1], note: "with your broker" },
  { beat: 3, en: "The exchange is where orders meet.", lit: ["phone", "broker", "exchange"], legs: [0, 0, 1], note: "order at the exchange" },
  { beat: 4, en: "Your shares land in a vault.", lit: ["phone", "broker", "exchange", "demat"], legs: [0, 0, 0], note: "shares in your demat" },
];

test.describe("Chapter 01 scroll stops", () => {
  test("the four stops light up in order along the path", async ({ page }) => {
    await open(page, "/en/01");
    for (const stop of STOPS) {
      await scrollToPct(page, mid(stop.beat));
      await expect.poll(() => visibleBeats(page), `beat ${stop.beat}`).toEqual([stop.en]);
      const map = await readMap(page);
      expect(map.lit, `lit at beat ${stop.beat}`).toEqual(stop.lit);
      expect(map.legs, `legs at beat ${stop.beat}`).toEqual(stop.legs);
      const h = await hud(page);
      expect(h.value).toBe("₹2,000");
      expect(h.note).toBe(stop.note);
    }
  });

  test("the rupee travels out, and the share token travels back", async ({ page }) => {
    await open(page, "/en/01");

    await scrollToPct(page, mid(1));
    await expect.poll(async () => (await readMap(page)).moneyOn).toBe(true);
    expect((await readMap(page)).moneyAt).toEqual(["phone"]);
    expect((await readMap(page)).shareOn).toBe(false);

    await scrollToPct(page, mid(2));
    await expect.poll(async () => (await readMap(page)).moneyAt).toEqual(["broker"]);

    await scrollToPct(page, mid(3));
    await expect.poll(async () => (await readMap(page)).moneyAt).toEqual(["exchange"]);

    await scrollToPct(page, mid(4));
    await expect.poll(async () => (await readMap(page)).shareOn).toBe(true);
    expect((await readMap(page)).shareAt).toEqual(["demat"]);
    expect((await readMap(page)).moneyOn).toBe(false);
  });

  test("the demat beat sets up Chapter 04's charge", async ({ page }) => {
    await open(page, "/en/01");
    await scrollToPct(page, mid(5));
    await expect.poll(() => visibleBeats(page)).toEqual(["Four stops, four jobs."]);
    await expect(page.getByTestId("beat").nth(5)).toContainText("a charge in Chapter 04");
  });

  test("scrolling backwards empties the loop", async ({ page }) => {
    await open(page, "/en/01");
    await scrollToPct(page, 97);
    await expect.poll(async () => (await readMap(page)).lit).toHaveLength(4);
    await scrollToPct(page, mid(0));
    await expect.poll(async () => (await readMap(page)).lit).toEqual([]);
    const map = await readMap(page);
    expect(map.legs).toEqual([1, 1, 1]);
    expect(map.moneyOn).toBe(false);
    expect(map.shareOn).toBe(false);
  });
});

test("Hindi: same stops, Hindi copy", async ({ page }) => {
  await open(page, "/hi/01");
  await scrollToPct(page, mid(4));
  await expect.poll(() => visibleBeats(page)).toEqual(["आपके share तिजोरी में पहुँचते हैं।"]);
  await expect.poll(async () => (await hud(page)).note).toBe("share demat में");
  expect((await readMap(page)).lit).toHaveLength(4);
});

test("has a scroll budget and stays pinned", async ({ page }) => {
  await open(page, "/en/01");
  const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 5);
  await scrollToPct(page, 50);
  await expect
    .poll(() => page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)))
    .toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("every stop lit, every beat readable", async ({ page }) => {
    await open(page, "/en/01");
    expect((await hud(page)).note).toBe("fresh start");
    await scene(page).scrollIntoViewIfNeeded();
    await expect.poll(async () => (await hud(page)).note).toBe("shares in your demat");
    const map = await readMap(page);
    expect(map.lit).toHaveLength(4);
    expect(map.legs).toEqual([0, 0, 0]);
    expect(map.shareOn).toBe(true);
    expect(map.shareAt).toEqual(["demat"]);
    expect(await visibleBeats(page)).toHaveLength(7);
  });
});
