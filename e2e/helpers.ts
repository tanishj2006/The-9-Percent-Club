import { expect, type Page } from "@playwright/test";

export const scene = (page: Page) => page.getByTestId("scene");

/** Waits for the dynamically imported scene and its timeline, not just the page. */
export async function open(page: Page, path = "/en") {
  await page.goto(path);
  await expect(scene(page)).toBeVisible();
  await expect(page.locator("[data-part=wheelA]")).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Scrolls to a percentage of the scene's own scroll span, through the real
 * window scroll. Rounds up: 30% is exactly a beat boundary, and rounding down
 * by a pixel would land on the previous beat.
 */
export async function scrollToPct(page: Page, pct: number) {
  await page.evaluate((pct) => {
    const el = document.querySelector<HTMLElement>("[data-testid=scene]")!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: Math.ceil(top + (span * pct) / 100), behavior: "instant" });
  }, pct);
  // Wait for the timeline to arrive, or a poll on something already true (beat 0
  // at 2%) passes before the scroll has landed.
  await expect
    .poll(async () => (await readScene(page)).rail, `timeline reaches ${pct}%`)
    .toBeCloseTo(pct / 100, 2);
}

/** Reads what is rendered, never scene internals. */
export const readScene = (page: Page) =>
  page.evaluate(() => {
    const visible = (el: Element) => {
      const s = getComputedStyle(el);
      return s.visibility !== "hidden" && Number(s.opacity) > 0;
    };
    const beats = [...document.querySelectorAll("[data-testid=beat]")].filter(visible);
    const parts = [...document.querySelectorAll("[data-part]")].filter(visible);
    const tokens = [...document.querySelectorAll<SVGRectElement>("[data-token]")];
    const fills = tokens.map((t) => getComputedStyle(t).stroke);
    const empty = getComputedStyle(document.documentElement).getPropertyValue("--rule");
    const cups = document.querySelector("[data-testid=cups]")!;
    return {
      beatCount: beats.length,
      beat: beats.map((b) => b.querySelector("h2")!.textContent).join(" | "),
      hud: document.querySelector("[data-testid=hud-value]")!.textContent,
      sub: document.querySelector("[data-testid=hud-sub]")!.textContent,
      parts: parts.length,
      partIds: parts.map((p) => p.getAttribute("data-part")).sort(),
      gold: tokens.filter((t) => t.dataset.state === "gold").length,
      mine: tokens.filter((t) => t.dataset.state === "mine").map((t) => t.dataset.token),
      distinctTokenColours: new Set(fills).size,
      empty,
      cups: visible(cups) ? cups.querySelector("[data-testid=cups-value]")!.textContent : null,
      rail: new DOMMatrix(getComputedStyle(document.querySelector("[data-testid=rail]")!).transform).a,
    };
  });

/** The five stops from the brief, as the prototype's logic defines them. */
export const STOPS = [
  { pct: 2, beat: 0, en: "Two friends, one cart.", hi: "दो दोस्त, एक cart।", hud: "₹2,000", parts: 1, gold: 5, mine: 0, cups: null, owned: false },
  { pct: 30, beat: 3, en: "You buy 2 tokens.", hi: "आपने 2 token खरीदे।", hud: "₹2,000", parts: 7, gold: 69, mine: 2, cups: null, owned: true },
  { pct: 55, beat: 5, en: "April. It is 38 degrees.", hi: "अप्रैल। 38 डिग्री।", hud: "₹2,000", parts: 10, gold: 98, mine: 2, cups: "240", owned: true },
  { pct: 78, beat: 7, en: "June. It rains for nine days straight.", hi: "जून। नौ दिन लगातार बारिश।", hud: "₹4,400", parts: 10, gold: 98, mine: 2, cups: "30", owned: true },
  { pct: 97, beat: 9, en: "You own a business, not a bet.", hi: "आपके पास एक business है, कोई satta नहीं।", hud: "₹3,400", parts: 10, gold: 98, mine: 2, cups: null, owned: true },
] as const;
