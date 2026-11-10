# The 9% Club

> Most traders lose money. Here's the arithmetic.

A scroll-driven, bilingual (English/Hindi) course that teaches an absolute
beginner what the Indian stock market actually is, starting from "what is a
share" and ending at what the evidence supports.

Built on the cost model and research findings from `nse-backtester`: every
figure about charges, breakeven and drawdown comes from a real engine, not
from a blog post.

## Status

All nine chapters, 00 to 08, are built and verified.

Hindi copy is awaiting review before launch.

## Running it

    npm install
    npm run dev           # http://localhost:3000, redirects to /en or /hi

Chapters live at `/en`, `/en/01` to `/en/08`, with the same paths under `/hi`.

    npm test              # cost engine and copy checks (vitest)
    npx playwright install chromium   # once
    npm run test:e2e      # browser tests against a production build
    E2E_DEV=1 npm run test:e2e        # the same, under next dev and strict mode
    npm run analyze       # bundle report in .next/analyze

`prototype/chapter-00.html` is the original standalone reference.

## Deploying

On Vercel:

1. **Import the repo** as a new project. The framework preset is Next.js and
   no build settings need changing.
2. **Set `NEXT_PUBLIC_SITE_URL`** to the public address, for example
   `https://example.com`, for Production. Canonical links, hreflang, the
   sitemap and share cards use it. Without it, Vercel falls back to the
   project's production URL, and local builds to localhost.
3. **Turn on Web Analytics** in the project settings. `@vercel/analytics` only
   renders when `VERCEL_ENV` is `production`, so previews and local runs send
   nothing.
4. **Check the share cards on a preview deploy** before going live. Open
   `/en/04/opengraph-image` and `/hi/05/opengraph-image` and look at them:
   the Hindi must read correctly, and ₹ must appear in the English titles.
   They are drawn with HarfBuzz (WebAssembly) and fonts read from
   `src/assets/fonts` with `fs`.

The cards are rendered once, at build time, for the 18 real routes, and
`dynamicParams = false` stops any other path from rendering one on request. So
the fonts and the WebAssembly are needed only during the build, where the whole
repo is available, and `outputFileTracingIncludes` is not required. If a card is
ever made to render on request, add the fonts to `outputFileTracingIncludes` in
`next.config.ts` first.

## Approach

Scroll scenes use GSAP ScrollTrigger through `useGSAP`, with Lenis for smooth
scrolling. Each scene is loaded with `next/dynamic` and `ssr: false`, so GSAP
stays out of the initial bundle, which matters because the audience is on
Indian mobile data.

Every scene shares one pattern, in `src/scenes/shared/useScene.ts`. The section
gets explicit extra height in CSS (`--beats * 88svh`), a `position: sticky`
child does the pinning, and ScrollTrigger only measures progress across the
section. It does not use `pin: true`: keeping the height in CSS reserves it
before the scene's chunk arrives, so the page cannot shift when it loads.

Cost figures come from `src/lib/costs.ts`, a port of the `nse-backtester` cost
engine tested against `data/cost-reference.json`. Copy takes those figures as
values, so a number cannot drift from the engine.

The persistent money HUD is the narrative spine. It carries through every
chapter, so the reader watches their money move rather than reading about it.
Each chapter sets its own starting point and labels what the number means.

## Content rules

SEBI regulates investor education. Two hard rules this site follows:

1. **No price data under 30 days old.** From 1 July 2026 educational use of
   price data requires a 30-day lag. All data here is historical (2019-2025).
2. **No naming securities suggestively.** No "buy X", no price predictions,
   no implication of future movement for any named stock.

Everything here is education. Nothing is advice.
