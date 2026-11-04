import path from "node:path";
import { expect, test } from "@playwright/test";
import { open, readScene, scrollToPct } from "./helpers";

/**
 * prototype/chapter-00.html is the spec, so ask it rather than trusting a table
 * typed by hand. Stops are the five from the brief plus the middle of each beat.
 *
 * 30.2 stands in for 30. Beat copy here fades in 1% before its boundary, and
 * the tokens come with it so copy and tokens land together, where the prototype
 * flips them on p > 0.30. Everywhere outside those windows the two must agree.
 */
const STOPS = [2, 5, 15, 25, 30.2, 35, 45, 55, 65, 75, 78, 85, 95, 97];
const prototypeUrl = `file://${path.resolve("prototype/chapter-00.html")}`;

test.skip(({ isMobile }) => isMobile, "the prototype's logic is viewport independent");

for (const locale of ["en", "hi"] as const) {
  test(`${locale}: matches the prototype at every stop`, async ({ page, context }) => {
    const proto = await context.newPage();
    await proto.route(/fonts\.g/, (route) => route.abort());
    await proto.goto(prototypeUrl);
    if (locale === "hi") await proto.click("#lang");
    await open(page, `/${locale}`);

    for (const pct of STOPS) {
      const expected = await proto.evaluate((pct) => {
        const el = document.querySelector<HTMLElement>("#scene")!;
        const span = el.offsetHeight - innerHeight;
        document.documentElement.style.scrollBehavior = "auto";
        scrollTo(0, Math.ceil(el.offsetTop + (span * pct) / 100));
        return new Promise<Record<string, unknown>>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const tokens = [...document.querySelectorAll("#grid .tok")];
              const cupsOn = (document.querySelector("#cupWrap") as HTMLElement).style.opacity === "1";
              resolve({
                beat: document.querySelector(".beat.on h2")!.textContent,
                hud: document.querySelector("#hudVal")!.textContent,
                sub: document.querySelector("#hudSub")!.textContent,
                parts: document.querySelectorAll('#cart g[opacity="1"]').length,
                gold: tokens.filter((t) => t.getAttribute("stroke") === "var(--marigold)").length,
                mine: tokens.filter((t) => t.getAttribute("stroke") === "var(--teal)").length,
                cups: cupsOn ? document.querySelector("#cupN")!.textContent : null,
              });
            }),
          ),
        );
      }, pct);

      await scrollToPct(page, pct);
      await expect.poll(async () => (await readScene(page)).beat, `beat at ${pct}%`).toBe(expected.beat);
      await expect
        .poll(async () => {
          const s = await readScene(page);
          return { beat: s.beat, hud: s.hud, sub: s.sub, parts: s.parts, gold: s.gold, mine: s.mine.length, cups: s.cups };
        }, `state at ${pct}%`)
        .toEqual(expected);
    }
  });
}
