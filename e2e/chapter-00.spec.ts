import { expect, test } from "@playwright/test";
import { open, readScene, scene, scrollToPct, STOPS } from "./helpers";

test.describe("the five stops", () => {
  for (const locale of ["en", "hi"] as const) {
    test(`${locale}: exact state at 2, 30, 55, 78 and 97%`, async ({ page }) => {
      await open(page, `/${locale}`);
      const seen = [];

      for (const stop of STOPS) {
        await scrollToPct(page, stop.pct);
        await expect
          .poll(async () => (await readScene(page)).beat, `beat at ${stop.pct}%`)
          .toBe(stop[locale]);

        const s = await readScene(page);
        expect(s.beatCount, `exactly one beat at ${stop.pct}%`).toBe(1);
        expect(s.hud, `HUD at ${stop.pct}%`).toBe(stop.hud);
        expect(s.parts, `cart parts at ${stop.pct}%`).toBe(stop.parts);
        expect(s.gold, `marigold tokens at ${stop.pct}%`).toBe(stop.gold);
        expect(s.mine, `teal tokens at ${stop.pct}%`).toHaveLength(stop.mine);
        expect(s.cups, `cups at ${stop.pct}%`).toBe(stop.cups);
        expect(s.rail).toBeCloseTo(stop.pct / 100, 2);
        expect(s.sub !== "", `token line at ${stop.pct}%`).toBe(stop.owned);
        seen.push(s);
      }

      // Beat text changes at every stop. Between each pair, HUD or the cart
      // also changes. They can't both change every time: the story holds the
      // HUD at ₹2,000 until beat 6 and the cart is finished by 43%.
      expect(new Set(seen.map((s) => s.beat)).size).toBe(STOPS.length);
      for (let i = 1; i < seen.length; i++) {
        const [a, b] = [seen[i - 1], seen[i]];
        expect(a.hud !== b.hud || a.parts !== b.parts, `stop ${i} moved`).toBe(true);
      }
    });
  }

  for (const [locale, line] of [
    ["en", "the cart clears about ₹1,20,000 over the season"],
    ["hi", "लगभग ₹1,20,000 बचे"],
  ] as const) {
    test(`${locale}: the summer profit reads ₹1,20,000, and only that`, async ({ page }) => {
      await open(page, `/${locale}`);
      await scrollToPct(page, 55);
      const beat = page.getByTestId("beat").filter({ hasText: "₹1,20,000" });
      await expect(beat).toBeVisible();
      await expect(beat).toContainText(line);
      await expect(page.locator("body")).not.toContainText("₹2,20,000");
    });
  }

  test("the HUD walks the whole money arc", async ({ page }) => {
    await open(page);
    for (const [pct, hud] of [
      [5, "₹2,000"],
      [65, "₹4,400"],
      [85, "₹3,150"],
      [95, "₹3,400"],
    ] as const) {
      await scrollToPct(page, pct);
      await expect(page.getByTestId("hud-value")).toHaveText(hud);
    }
  });

  test("the HUD colours itself against the ₹2,000 start", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("hud")).not.toHaveAttribute("data-tone");
    await scrollToPct(page, 65);
    await expect(page.getByTestId("hud")).toHaveAttribute("data-tone", "up");
  });

  test("the cup counter ticks through intermediate values", async ({ page }) => {
    await open(page);
    const at = async (pct: number) => {
      await scrollToPct(page, pct);
      return (await readScene(page)).cups;
    };
    const rising = Number(await at(52));
    expect(rising).toBeGreaterThan(0);
    expect(rising).toBeLessThan(240);
    const falling = Number(await at(72));
    expect(falling).toBeGreaterThan(30);
    expect(falling).toBeLessThan(240);
  });

  test("the marigold and teal tokens really differ on screen", async ({ page }) => {
    await open(page);
    await scrollToPct(page, 30);
    await expect.poll(async () => (await readScene(page)).mine).toEqual(["44", "45"]);
    // empty, marigold, teal
    await expect.poll(async () => (await readScene(page)).distinctTokenColours).toBe(3);
  });
});

test.describe("scroll mechanics", () => {
  test("scrolling backwards undoes everything", async ({ page }) => {
    await open(page);
    const first = STOPS[0];
    await scrollToPct(page, first.pct);
    await expect.poll(async () => (await readScene(page)).beat).toBe(first.en);
    const before = await readScene(page);

    await scrollToPct(page, 97);
    await expect.poll(async () => (await readScene(page)).hud).toBe("₹3,400");
    await scrollToPct(page, first.pct);
    await expect.poll(async () => (await readScene(page)).beat).toBe(first.en);
    await expect.poll(async () => (await readScene(page)).hud).toBe("₹2,000");

    const after = await readScene(page);
    expect(after.parts).toBe(before.parts);
    expect(after.partIds).toEqual(before.partIds);
    expect(after.gold).toBe(before.gold);
    expect(after.mine).toEqual([]);
    expect(after.cups).toBeNull();
    expect(after.sub).toBe("");
  });

  test("the scene has a scroll budget and stays pinned (the prototype's bug)", async ({ page }) => {
    await open(page);
    const viewport = page.viewportSize()!;
    const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
    expect(height).toBeGreaterThan(viewport.height * 8);

    for (const pct of [10, 50, 90]) {
      await scrollToPct(page, pct);
      await expect
        .poll(() =>
          page.getByTestId("scene-sticky").evaluate((el) => Math.round(el.getBoundingClientRect().top)),
        )
        .toBe(0);
    }
  });

  test("before the scene nothing has started; after it, it holds", async ({ page }) => {
    await open(page);
    const start = await readScene(page);
    expect(start.parts).toBe(0);
    expect(start.gold).toBe(0);
    expect(start.hud).toBe("₹2,000");

    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await expect(page.getByTestId("hud-value")).toHaveText("₹3,400");
    await expect(page.getByTestId("hud-sub")).not.toBeEmpty();
  });

  test("real wheel input drives the scene through Lenis", async ({ page, isMobile }) => {
    test.skip(isMobile, "mobile scroll is native; Lenis only smooths the wheel");
    await open(page);
    await page.mouse.move(400, 400);
    const { y } = await scene(page).boundingBox().then((b) => b!);
    for (let moved = 0; moved < y + 2600; moved += 400) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(60);
    }
    await expect.poll(async () => (await readScene(page)).parts).toBeGreaterThan(3);
    await expect.poll(async () => (await readScene(page)).gold).toBeGreaterThan(20);
  });

  test("a reload mid-scene restores the story at that point", async ({ page }) => {
    await open(page);
    await scrollToPct(page, 78);
    await expect(page.getByTestId("hud-value")).toHaveText("₹4,400");
    await page.reload();
    await expect(page.getByTestId("hud-value")).toHaveText("₹4,400");
    const s = await readScene(page);
    expect(s.beat).toBe(STOPS[3].en);
    expect(s.parts).toBe(10);
  });
});

test("strict mode registers each trigger once, even across a language swap", async ({ page }) => {
  test.skip(process.env.E2E_DEV !== "1", "__npc only exists under next dev");
  await open(page);
  const triggers = () =>
    page.evaluate(() => (window as unknown as { __npc: { triggers(): number } }).__npc.triggers());
  await expect.poll(triggers).toBe(1);
  await page.getByTestId("lang-toggle").click();
  await expect(page).toHaveURL(/\/hi$/);
  await expect(page.locator("[data-part=wheelA]")).toBeAttached();
  await expect.poll(triggers).toBe(1);
});

test.describe("language", () => {
  test("toggling mid-scene keeps the reader's place", async ({ page }) => {
    await open(page);
    await scrollToPct(page, 78);
    await expect.poll(async () => (await readScene(page)).beat).toBe(STOPS[3].en);
    const y = await page.evaluate(() => window.scrollY);

    await page.getByTestId("lang-toggle").click();
    await expect(page).toHaveURL(/\/hi$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect.poll(async () => (await readScene(page)).beat).toBe(STOPS[3].hi);

    const s = await readScene(page);
    expect(s.hud).toBe("₹4,400");
    expect(s.sub).toBe("100 में से 2 token");
    expect(s.parts).toBe(10);
    expect(s.gold).toBe(98);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(4);
    await expect(page.getByTestId("lang-toggle")).toHaveText("हिं");
    await expect(page.getByTestId("lang-toggle")).toHaveAttribute("aria-pressed", "true");

    // The scene must still be alive after the swap, in both directions.
    await scrollToPct(page, 97);
    await expect.poll(async () => (await readScene(page)).beat).toBe(STOPS[4].hi);
    await page.getByTestId("lang-toggle").click();
    await expect(page).toHaveURL(/\/en$/);
    await expect.poll(async () => (await readScene(page)).beat).toBe(STOPS[4].en);
    await scrollToPct(page, 2);
    await expect.poll(async () => (await readScene(page)).hud).toBe("₹2,000");
  });

  test("static copy and fonts follow the language", async ({ page }) => {
    await open(page, "/hi");
    await expect(page.locator("h1")).toContainText("आपके पास ₹2,000 हैं।");
    await expect(page.locator("footer")).toContainText("education");
    const family = await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toContain("mukta");
  });

  test("/ redirects by browser language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "hi-IN" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/hi$/);
    await context.close();
  });
});

test.describe("theme", () => {
  const bg = (page: import("@playwright/test").Page) =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  test("the toggle wins both ways and survives reload and language", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page);
    expect(await bg(page)).toBe("rgb(250, 247, 242)");

    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => bg(page)).toBe("rgb(19, 19, 22)");

    await page.getByTestId("lang-toggle").click();
    await expect(page).toHaveURL(/\/hi$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await bg(page)).toBe("rgb(19, 19, 22)");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await bg(page)).toBe("rgb(19, 19, 22)");
  });

  test("system dark is respected, and the toggle can override it to light", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await open(page);
    expect(await bg(page)).toBe("rgb(19, 19, 22)");
    await page.getByTestId("theme-toggle").click();
    await expect.poll(() => bg(page)).toBe("rgb(250, 247, 242)");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("final state, no timeline, and every beat still readable", async ({ page }) => {
    await open(page);
    expect((await readScene(page)).hud).toBe("₹2,000");

    await scene(page).scrollIntoViewIfNeeded();
    await expect(page.getByTestId("hud-value")).toHaveText("₹3,400");

    const s = await readScene(page);
    expect(s.parts).toBe(10);
    expect(s.gold).toBe(98);
    expect(s.mine).toEqual(["44", "45"]);
    expect(s.beatCount).toBe(10);
    expect(s.sub).not.toBe("");

    const height = await scene(page).evaluate((el: HTMLElement) => el.offsetHeight);
    expect(await page.getByTestId("scene-sticky").evaluate((el) => getComputedStyle(el).position)).toBe("static");
    expect(height).toBeGreaterThan(page.viewportSize()!.height);
  });
});

test.describe("layout", () => {
  for (const [name, width, height] of [
    ["small Android", 360, 640],
    ["390 wide", 390, 844],
    ["laptop", 1280, 720],
  ] as const) {
    for (const locale of ["en", "hi"] as const) {
      test(`${name} ${locale}: nothing clipped at any beat`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await open(page, `/${locale}`);
        for (let pct = 5; pct < 100; pct += 10) {
          await scrollToPct(page, pct);
          await page.waitForTimeout(40);
          const box = await page.evaluate(() => {
            const visibleBeat = [...document.querySelectorAll<HTMLElement>("[data-testid=beat]")].find(
              (b) => getComputedStyle(b).visibility !== "hidden",
            )!;
            const r = (el: Element) => el.getBoundingClientRect();
            const svgs = [...document.querySelectorAll(".stage svg")];
            return {
              beatBottom: r(visibleBeat).bottom,
              captionTop: r(document.querySelector(".caption")!).top,
              svgBottom: Math.max(...svgs.map((s) => r(s).bottom)),
              svgHeights: svgs.map((s) => r(s).height),
              hudBottom: r(document.querySelector("[data-testid=hud]")!).bottom,
              svgTop: Math.min(...svgs.map((s) => r(s).top)),
              scrollWidth: document.documentElement.scrollWidth,
              viewport: [innerWidth, innerHeight],
            };
          });
          expect(box.beatBottom, `beat fits at ${pct}%`).toBeLessThanOrEqual(box.viewport[1]);
          expect(box.svgBottom, `art clear of caption at ${pct}%`).toBeLessThanOrEqual(box.captionTop + 1);
          expect(Math.min(...box.svgHeights), `art still legible at ${pct}%`).toBeGreaterThan(90);
          expect(box.svgTop, `art clear of HUD at ${pct}%`).toBeGreaterThanOrEqual(box.hudBottom - 1);
          expect(box.scrollWidth, "no horizontal scroll").toBeLessThanOrEqual(box.viewport[0]);
        }
      });
    }
  }
});

test.describe("page health", () => {
  test("no console errors or hydration warnings through a full read", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" || /hydrat/i.test(m.text())) problems.push(m.text());
    });
    await open(page);
    for (const { pct } of STOPS) {
      await scrollToPct(page, pct);
      await page.waitForTimeout(50);
    }
    await page.getByTestId("lang-toggle").click();
    await expect(page).toHaveURL(/\/hi$/);
    await page.getByTestId("theme-toggle").click();
    expect(problems).toEqual([]);
  });

  test("footer says education, not advice, with the name beside its tagline", async ({ page }) => {
    await open(page);
    const footer = page.locator("footer");
    await expect(footer).toContainText("The 9% Club");
    await expect(footer).toContainText("Most traders lose money. Here's the arithmetic.");
    await expect(footer).toContainText("Nothing is advice.");
  });

  test("an unknown locale is a 404, not a crash", async ({ page }) => {
    const response = await page.goto("/fr");
    expect(response?.status()).toBe(404);
  });
});
