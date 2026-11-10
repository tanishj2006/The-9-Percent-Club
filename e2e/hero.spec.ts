import { expect, test, type Page } from "@playwright/test";
import { open } from "./helpers";

const box = (page: Page, testId: string) => page.getByTestId(testId).boundingBox().then((b) => b!);
const people = (page: Page) => page.getByTestId("hero-figure").locator(".hero-person");

/** WCAG contrast ratio between two CSS rgb() colours. */
function contrast(a: string, b: string) {
  const lum = (c: string) => {
    const [r, g, bl] = c.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

test.describe("order and screens", () => {
  test("hero, then the chapter map, then chapter 00's intro, then the scene", async ({ page }) => {
    await page.goto("/en");
    const order = await page.evaluate(() => {
      const y = (s: string) => document.querySelector(s)!.getBoundingClientRect().top;
      return [y("[data-testid=hero]"), y("[data-testid=chapter-map]"), y("#chapter-00"), y(".scene")];
    });
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(4);
  });

  for (const [w, h] of [[390, 844], [360, 640], [1280, 800]] as const) {
    test(`${w}×${h}: the hero fills the screen below the header, and chapter 00 is not in it`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/en");
      const header = await box(page, "site-header");
      const hero = await box(page, "hero");
      expect(hero.height).toBeGreaterThanOrEqual(h - header.height - 1);
      const intro = await page.locator("#chapter-00").boundingBox();
      expect(intro!.y, "chapter 00 starts after the first screen").toBeGreaterThanOrEqual(h - 1);
      await expect(page.getByTestId("hero-start")).toBeInViewport();
    });
  }
});

test.describe("hierarchy", () => {
  for (const [w, h] of [[390, 844], [768, 1024], [1280, 800]] as const) {
    for (const locale of ["en", "hi"] as const) {
      test(`${w} ${locale}: the brand name is the largest type, and chapter 00's title does not compete`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await page.goto(`/${locale}`);
        const sizes = await page.evaluate(() => {
          const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
          const hero = document.querySelector("[data-testid=hero]")!;
          const name = hero.querySelector(".hero-name")!;
          const others = [...hero.querySelectorAll("*")].filter((el) => el !== name && el.textContent?.trim() && !(el instanceof SVGElement));
          return { name: size(name), largestOther: Math.max(...others.map(size)), title: size(document.querySelector("#chapter-00 h1")!) };
        });
        expect(sizes.name).toBeGreaterThan(sizes.largestOther);
        expect(sizes.name, "chapter 00's title is smaller than the brand").toBeGreaterThan(sizes.title);
      });
    }
  }
});

test.describe("the figures", () => {
  for (const scheme of ["light", "dark"] as const) {
    test(`${scheme}: 91 filled in muted ink, 9 neutral outlines, nothing marigold`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/en");
      await expect(people(page)).toHaveCount(100);
      const styles = await people(page).evaluateAll((els) => {
        const root = getComputedStyle(document.documentElement);
        const resolve = (v: string) => {
          const probe = document.createElement("span");
          probe.style.color = `var(${v})`;
          document.body.append(probe);
          const c = getComputedStyle(probe).color;
          probe.remove();
          return c;
        };
        void root;
        return {
          inkSoft: resolve("--ink-soft"),
          inkFaint: resolve("--ink-faint"),
          marigold: resolve("--marigold"),
          people: els.map((el) => {
            const s = getComputedStyle(el);
            return { lost: el.hasAttribute("data-lost"), fill: s.fill, stroke: s.stroke, opacity: s.opacity, filter: s.filter };
          }),
        };
      });
      const lost = styles.people.filter((p) => p.lost);
      const kept = styles.people.filter((p) => !p.lost);
      expect(lost).toHaveLength(91);
      expect(kept).toHaveLength(9);
      for (const p of lost) {
        expect(p.fill, "the 91 are the visible mass").toBe(styles.inkSoft);
        expect(p.opacity).toBe("1");
      }
      for (const p of kept) {
        expect(p.fill, "the 9 are outlines").toBe("none");
        expect(p.stroke).toBe(styles.inkFaint);
        expect(p.filter, "no glow").toBe("none");
      }
      for (const p of styles.people) {
        expect(p.fill).not.toBe(styles.marigold);
        expect(p.stroke).not.toBe(styles.marigold);
      }
    });
  }

  test("the caption says it is a count of FY25, not a target", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByTestId("hero-figure").locator("figcaption")).toHaveText(
      "A count of what happened in FY25, not a target: 91 of every 100 individual F&O traders lost money, by SEBI's count.",
    );
    await page.goto("/hi");
    await expect(page.getByTestId("hero-figure").locator("figcaption")).toContainText("कोई लक्ष्य नहीं");
    await expect(page.getByTestId("hero-figure").getByRole("img")).toHaveAccessibleName(/91/);
  });

  test("with reduced motion it is the same, and nothing animates", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/en");
    const animations = await page.getByTestId("hero").evaluate((el) => el.getAnimations({ subtree: true }).length);
    expect(animations).toBe(0);
    const filled = await people(page).evaluateAll((els) => els.filter((el) => getComputedStyle(el).fill !== "none").length);
    expect(filled).toBe(91);
    await context.close();
  });
});

test.describe("meta line and lede", () => {
  for (const scheme of ["light", "dark"] as const) {
    for (const locale of ["en", "hi"] as const) {
      test(`${scheme} ${locale}: one meta line, at 4.5:1 or better`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(`/${locale}`);
        const meta = page.getByTestId("hero-meta");
        await expect(meta).toHaveCount(1);
        await expect(meta).toHaveText(locale === "en" ? "9 chapters, about 4 minutes each, English and हिंदी" : "9 अध्याय, हर एक करीब 4 मिनट, English और हिंदी");
        const [fg, bg] = await meta.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(document.body).backgroundColor]);
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  test("the four-minute claim appears once, not twice", async ({ page }) => {
    for (const [locale, pattern] of [["en", /four minutes|4 minutes/gi], ["hi", /चार मिनट|4 मिनट/g]] as const) {
      await page.goto(`/${locale}`);
      const text = (await page.locator("main").textContent())!;
      expect(text.match(pattern), locale).toHaveLength(1);
    }
  });
});

test.describe("Start chapter 00", () => {
  /** Records scrollY on every frame for a while after an action. */
  const track = (page: Page, ms = 2500) =>
    page.evaluate(
      (ms) =>
        new Promise<number[]>((resolve) => {
          const seen: number[] = [];
          const start = performance.now();
          const tick = () => {
            seen.push(Math.round(window.scrollY));
            if (performance.now() - start < ms) requestAnimationFrame(tick);
            else resolve(seen);
          };
          requestAnimationFrame(tick);
        }),
      ms,
    );

  const landsBelowHeader = async (page: Page) => {
    const header = await box(page, "site-header");
    const intro = (await page.locator("#chapter-00").boundingBox())!;
    expect(Math.abs(intro.y - (header.y + header.height)), "lands just below the header").toBeLessThan(4);
    await expect(page.locator("#chapter-00 h1")).toBeInViewport();
  };

  test("is a plain anchor, a full-size target", async ({ page }) => {
    await page.goto("/en");
    const start = page.getByTestId("hero-start");
    await expect(start).toHaveText("Start chapter 00 ↓");
    await expect(start).toHaveAttribute("href", "#chapter-00");
    expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });

  test("glides to chapter 00 instead of jumping, once the page is running", async ({ page }) => {
    await open(page, "/en");
    expect(await page.evaluate(() => document.documentElement.classList.contains("lenis"))).toBe(true);
    const recording = track(page);
    await page.getByTestId("hero-start").click();
    const path = await recording;
    const target = path.at(-1)!;
    expect(target, "it moved").toBeGreaterThan(300);
    const between = path.filter((y) => y > 20 && y < target - 20);
    expect(between.length, "passes through the positions in between").toBeGreaterThan(5);
    expect(path, "never overshoots and comes back").toEqual([...path].sort((a, b) => a - b));
    await landsBelowHeader(page);
  });

  test("the browser glides by itself until Lenis takes over, and only then", async ({ page }) => {
    await open(page, "/en");
    const behaviour = () => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    expect(await behaviour(), "with Lenis running, the browser does not also smooth").toBe("auto");
    await page.evaluate(() => document.documentElement.classList.remove("lenis"));
    expect(await behaviour(), "before Lenis, the browser smooths").toBe("smooth");
  });

  test("with reduced motion it jumps straight there, with no glide", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await open(page, "/en");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    const recording = track(page, 800);
    await page.getByTestId("hero-start").click();
    const path = await recording;
    const between = path.filter((y) => y > 20 && y < path.at(-1)! - 20);
    expect(between.length, "no in-between positions").toBeLessThanOrEqual(1);
    await landsBelowHeader(page);
    await context.close();
  });

  test("works with JavaScript off", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/hi");
    await expect(page.getByTestId("hero-start")).toHaveText("अध्याय 00 शुरू करें ↓");
    await page.getByTestId("hero-start").click();
    await expect(page).toHaveURL(/#chapter-00$/);
    await expect(page.locator("#chapter-00 h1")).toBeInViewport();
    await context.close();
  });

  test("the scene still works after gliding there", async ({ page, isMobile }) => {
    test.skip(isMobile, "wheel input");
    await open(page, "/en");
    await page.getByTestId("hero-start").click();
    await expect(page.locator("#chapter-00 h1")).toBeInViewport();
    // Wait for the glide to finish, as a reader would, before moving on.
    await expect.poll(() => page.evaluate(() => new Promise<number>((r) => {
      const a = scrollY;
      setTimeout(() => r(Math.abs(scrollY - a)), 150);
    }))).toBe(0);
    await page.mouse.move(400, 400);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 400);
    await expect.poll(async () => (await page.locator("[data-part]").evaluateAll((els) => els.filter((el) => getComputedStyle(el).visibility !== "hidden").length))).toBeGreaterThan(0);
  });
});

test.describe("390px, both themes, both languages", () => {
  for (const scheme of ["light", "dark"] as const) {
    for (const locale of ["en", "hi"] as const) {
      test(`${scheme} ${locale}: nothing overlaps, nothing scrolls sideways`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(`/${locale}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
        const parts = await Promise.all(["hero-brand", "hero-figure"].map((id) => box(page, id)));
        const [a, b] = parts;
        const overlap = !(a.y + a.height <= b.y || b.y + b.height <= a.y || a.x + a.width <= b.x || b.x + b.width <= a.x);
        expect(overlap).toBe(false);
        const header = await box(page, "site-header");
        expect(a.y).toBeGreaterThanOrEqual(header.y + header.height);
        await expect(page.getByTestId("hero-figure").locator("figcaption")).toBeInViewport();
      });
    }
  }
});

test.describe("chapter map", () => {
  test("sits directly under the hero, lists all nine, and works", async ({ page }) => {
    await page.goto("/hi");
    const hero = await box(page, "hero");
    const map = await box(page, "chapter-map");
    expect(map.y - (hero.y + hero.height)).toBeLessThan(2);
    const links = page.getByTestId("chapter-map").getByRole("link");
    await expect(links).toHaveCount(9);
    await expect(links.nth(7)).toContainText("91% का आँकड़ा, FY25");
    await links.nth(4).click();
    await expect(page).toHaveURL(/\/hi\/04$/);
  });

  test("is compact on a phone: two columns of full-size touch targets", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    const links = page.getByTestId("chapter-map").getByRole("link");
    const [a, b] = [(await links.nth(0).boundingBox())!, (await links.nth(1).boundingBox())!];
    expect(Math.abs(a.y - b.y)).toBeLessThan(2);
    for (const link of await links.all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});
