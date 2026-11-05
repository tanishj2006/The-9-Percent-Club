import { expect, test } from "@playwright/test";
import { hud, open, scrollToPct, visibleBeats } from "./helpers";

const CHAPTERS = [
  { path: "", title: "Chapter 00", titleHi: "अध्याय 00" },
  { path: "/04", title: "Chapter 04", titleHi: "अध्याय 04" },
  { path: "/05", title: "Chapter 05", titleHi: "अध्याय 05" },
];

test.describe("navigation", () => {
  test("Next walks 00 → 04 → 05, Previous walks back", async ({ page }) => {
    await open(page);
    await page.getByTestId("next-chapter").click();
    await expect(page).toHaveURL(/\/en\/04$/);
    await expect(page.locator(".eyebrow").first()).toHaveText("Chapter 04");
    await page.getByTestId("next-chapter").click();
    await expect(page).toHaveURL(/\/en\/05$/);
    await expect(page.getByTestId("next-chapter")).toHaveCount(0);
    await page.getByTestId("prev-chapter").click();
    await expect(page).toHaveURL(/\/en\/04$/);
    await page.getByTestId("prev-chapter").click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByTestId("prev-chapter")).toHaveCount(0);
  });

  test("the switcher marks the current chapter and jumps", async ({ page }) => {
    await open(page, "/en/04");
    const switcher = page.getByTestId("chapter-switcher");
    await expect(switcher.getByRole("link", { name: "What a trade really costs" })).toHaveAttribute("aria-current", "page");
    await switcher.getByRole("link", { name: "Why ₹2,000 cannot trade" }).click();
    await expect(page).toHaveURL(/\/en\/05$/);
    await expect(switcher.getByRole("link", { name: "Why ₹2,000 cannot trade" })).toHaveAttribute("aria-current", "page");
  });

  test("a new chapter starts at the top, in a working scene", async ({ page }) => {
    await open(page);
    await scrollToPct(page, 97);
    await page.getByTestId("chapter-switcher").getByRole("link", { name: "What a trade really costs" }).click();
    await expect(page).toHaveURL(/\/en\/04$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await scrollToPct(page, 50);
    await expect.poll(async () => (await hud(page)).value).toBe("₹966.40");
  });

  test("Chapter 00 explains why the numbering jumps", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("chapter-nav")).toContainText("Chapters 01 to 03 are still being written");
  });
});

test.describe("HUD continuity", () => {
  test("₹3,400 from the cart becomes a labelled fresh ₹2,000, then the trade", async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect.poll(async () => (await hud(page)).value).toBe("₹3,400");

    await page.getByTestId("next-chapter").click();
    await expect(page).toHaveURL(/\/en\/04$/);
    await expect.poll(() => hud(page)).toEqual({ label: "Your money", value: "₹2,000", note: "fresh start" });

    await scrollToPct(page, 7);
    await expect.poll(() => visibleBeats(page)).toEqual(["Back to ₹2,000, in the real market."]);
    await expect(page.getByTestId("beat").first()).toContainText("The cart's money stays");

    await scrollToPct(page, 21);
    await expect.poll(() => hud(page)).toEqual({
      label: "This trade",
      value: "₹1,000.00",
      note: "₹1,000 of your ₹2,000",
    });
  });

  test("₹962.38 resets to ₹2,000 on Chapter 05, and back again", async ({ page }) => {
    await open(page, "/en/04");
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect.poll(async () => (await hud(page)).value).toBe("₹962.38");

    await page.getByTestId("next-chapter").click();
    await expect.poll(() => hud(page)).toEqual({ label: "Your money", value: "₹2,000", note: "fresh start" });

    await page.goBack();
    await expect(page).toHaveURL(/\/en\/04$/);
    await expect.poll(async () => (await hud(page)).value).toMatch(/^₹(2,000|962\.38)$/);
  });

  test("the money line on an unfinished chapter is never stale", async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect.poll(async () => (await hud(page)).value).toBe("₹3,400");
    await page.getByTestId("chapter-switcher").getByRole("link", { name: "Why ₹2,000 cannot trade" }).click();
    await expect(page).toHaveURL(/\/en\/05$/);
    await expect(page.locator("body")).not.toContainText("₹3,400");
  });
});

test.describe("routes", () => {
  for (const { path, title, titleHi } of CHAPTERS) {
    test(`/en${path} and /hi${path} serve the right language and survive a toggle`, async ({ page }) => {
      await open(page, `/en${path}`);
      await expect(page.locator(".eyebrow").first()).toHaveText(title);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");

      await page.getByTestId("lang-toggle").click();
      await expect(page).toHaveURL(new RegExp(`/hi${path}$`));
      await expect(page.locator(".eyebrow").first()).toHaveText(titleHi);
      await expect(page.locator("html")).toHaveAttribute("lang", "hi");

      await open(page, `/hi${path}`);
      await expect(page.locator(".eyebrow").first()).toHaveText(titleHi);
    });
  }

  test("chapters not built yet are a 404", async ({ page }) => {
    for (const n of ["01", "02", "03", "06", "07", "08"]) {
      const response = await page.goto(`/en/${n}`);
      expect(response?.status(), n).toBe(404);
    }
  });

  test("a page carries only its own chapter's copy", async ({ request }) => {
    const html = await (await request.get("/en")).text();
    expect(html).toContain("Two friends, one cart");
    expect(html).not.toContain("Meet the breakeven gap");
    expect(html).not.toContain("in one flat bite");
  });
});

test.describe("strict mode", () => {
  test.skip(process.env.E2E_DEV !== "1", "__npc only exists under next dev");

  test("one ScrollTrigger per scene, across every chapter change", async ({ page }) => {
    const triggers = () =>
      page.evaluate(() => (window as unknown as { __npc: { triggers(): number } }).__npc.triggers());

    await open(page);
    await expect.poll(triggers).toBe(1);
    for (const n of ["04", "05"]) {
      await page.getByTestId("next-chapter").click();
      await expect(page).toHaveURL(new RegExp(`/en/${n}$`));
      await expect(page.getByTestId("rail")).toBeAttached();
      await expect.poll(triggers).toBe(1);
    }
    await page.getByTestId("lang-toggle").click();
    await expect(page).toHaveURL(/\/hi\/05$/);
    await expect.poll(triggers).toBe(1);
    await page.getByTestId("prev-chapter").click();
    await expect(page).toHaveURL(/\/hi\/04$/);
    await expect.poll(triggers).toBe(1);
  });
});

test.describe("layout", () => {
  for (const { path } of CHAPTERS.slice(1)) {
    for (const [name, width, height] of [
      ["small Android", 360, 640],
      ["390 wide", 390, 844],
      ["laptop", 1280, 720],
    ] as const) {
      for (const locale of ["en", "hi"] as const) {
        test(`${path} ${name} ${locale}: nothing clipped at any beat`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await open(page, `/${locale}${path}`);
          for (let pct = 4; pct < 100; pct += 6) {
            await scrollToPct(page, pct);
            await page.waitForTimeout(30);
            const box = await page.evaluate(() => {
              const shown = (el: Element) => getComputedStyle(el).visibility !== "hidden";
              const r = (el: Element) => el.getBoundingClientRect();
              const beat = [...document.querySelectorAll("[data-testid=beat]")].find(shown)!;
              const content = [
                ...document.querySelectorAll(
                  ".stage-stack svg, .receipt-row, .receipt-zoom, .calc, .gap-chart svg, .readout",
                ),
              ].filter(shown);
              const hudBox = r(document.querySelector("[data-testid=hud]")!);
              const controls = [...document.querySelectorAll(".topbar .ctl")].map(r);
              return {
                beatBottom: r(beat).bottom,
                captionTop: r(document.querySelector(".caption")!).top,
                contentBottom: Math.max(...content.map((c) => r(c).bottom)),
                contentTop: Math.min(...content.map((c) => r(c).top)),
                hudBottom: hudBox.bottom,
                hudLeft: hudBox.left,
                hudRight: hudBox.right,
                controlsAllRight: Math.max(...controls.map((c) => c.right)),
                controlsBottom: Math.max(...controls.map((c) => c.bottom)),
                scrollWidth: document.documentElement.scrollWidth,
                viewport: [innerWidth, innerHeight],
              };
            });
            expect(box.beatBottom, `beat fits at ${pct}%`).toBeLessThanOrEqual(box.viewport[1]);
            expect(box.contentBottom, `art clear of caption at ${pct}%`).toBeLessThanOrEqual(box.captionTop + 1);
            expect(box.contentTop, `art clear of HUD at ${pct}%`).toBeGreaterThanOrEqual(box.hudBottom - 1);
            expect(box.controlsAllRight, `controls clear of HUD at ${pct}%`).toBeLessThanOrEqual(box.hudLeft);
            expect(box.controlsBottom, `controls clear of art at ${pct}%`).toBeLessThanOrEqual(box.contentTop);
            expect(box.hudRight, "HUD on screen").toBeLessThanOrEqual(box.viewport[0]);
            expect(box.scrollWidth, "no horizontal scroll").toBeLessThanOrEqual(box.viewport[0]);
          }
        });
      }
    }
  }
});

test.describe("page health", () => {
  test("no console errors reading all three chapters in both languages", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" || /hydrat|MISSING_MESSAGE|FORMATTING_ERROR/i.test(m.text())) problems.push(m.text());
    });
    for (const locale of ["en", "hi"]) {
      for (const { path } of CHAPTERS) {
        await open(page, `/${locale}${path}`);
        for (const pct of [10, 50, 95]) await scrollToPct(page, pct);
      }
    }
    expect(problems).toEqual([]);
  });

  for (const { path } of CHAPTERS.slice(1)) {
    test(`/en${path}: footer disclaimer, and no raw placeholders on the page`, async ({ page }) => {
      await open(page, `/en${path}`);
      await expect(page.locator("footer")).toContainText("Nothing is advice.");
      await expect(page.locator("body")).not.toContainText(/\{[a-zA-Z0-9]+\}/);
      await expect(page.locator("body")).not.toContainText("ch04.");
      await expect(page.locator("body")).not.toContainText("ch05.");
    });
  }
});
