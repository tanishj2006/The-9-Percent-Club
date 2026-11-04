# The 9% Club — project context

> Most traders lose money. Here's the arithmetic.

A scroll-driven, bilingual (English / Hindi) course teaching an absolute
beginner what the Indian stock market is. Starts at "what is a share" and ends
at what the evidence actually supports.

Owner: Tanish Jain. Audience: Indian students, 18–25, zero finance knowledge,
mostly on mid-range Android phones on mobile data.

---

## Decisions already made (do not relitigate)

| Thing | Decision |
|---|---|
| Name | **The 9% Club**, always paired with the tagline so it reads as a provocation, not a promise |
| Tagline | *Most traders lose money. Here's the arithmetic.* |
| Languages | English + Hindi, both first class |
| Stack | Next.js 15 App Router, Tailwind, next-themes, MDX, next-intl |
| Scroll | **GSAP + ScrollTrigger**, via `@gsap/react` (see below) |
| 3D | No Three.js. These are 2D data stories |
| AI tutor | Pre-generated answers only. No live API, no running cost |
| Hosting | Vercel |

### GSAP, with guardrails

Tanish knows GSAP well and will maintain this alone, so scenes use GSAP
ScrollTrigger rather than hand-rolled scroll maths. The prototype in
`prototype/` is vanilla only because it was built in a sandbox without npm;
treat its *behaviour* as the spec and its implementation as disposable.

Four things to get right:

1. **Use `@gsap/react`'s `useGSAP()` hook, not bare `useEffect`.** React 18
   strict mode double-invokes effects; without `useGSAP` the animations
   register twice and ScrollTrigger positions drift. This is the single most
   common GSAP-in-React bug.
2. **Client only.** ScrollTrigger touches `window`, so every scene component
   needs `"use client"` and the plugin must be registered inside the component
   or a client-side effect, never at module scope on a server component.
3. **Dynamic import per chapter.** `next/dynamic` with `ssr: false` for scene
   components so GSAP is not in the initial bundle. A reader on chapter 00
   should not download chapter 06's scene.
4. **Lenis for smooth scroll, not ScrollSmoother.** ScrollSmoother is a paid
   plugin; Lenis is free, lighter, and works well with ScrollTrigger. Call
   `ScrollTrigger.update()` on Lenis's scroll event.

Always honour `prefers-reduced-motion`: set the scene to its final state and
skip the timeline rather than disabling the content.

**Performance budget: keep initial JS under ~200KB gzipped.** GSAP plus
ScrollTrigger is roughly 50 to 70KB of that, which is affordable only if it is
code-split per chapter. Check with `@next/bundle-analyzer` before shipping.
If chapter 00 takes six seconds on a mid-range Android, nobody reaches
chapter 04.

---

## The narrative spine

A persistent **money HUD** threads every chapter. It starts at ₹2,000 in
chapter 00 and the number moves as the story does: costs take from it, the
drawdown crashes it, compounding grows it. The reader watches their money go
through the market rather than reading about it.

This is what makes the site a story instead of nine stacked articles. Every
scene should do something to that number.

---

## Chapter arc

| # | Chapter | Scene | State |
|---|---|---|---|
| 00 | What is a share? | Cold coffee cart assembles; 100 tokens fill; 2 are yours | **Prototype built + verified** |
| 01 | Who buys your token? | Money's path: phone → broker → exchange → demat | Not started |
| 02 | Who decides the price? | Order book fills, a trade matches | Not started |
| 03 | Reading a chart | One candle builds across a day | Not started |
| 04 | **What a trade really costs** | ₹1,000 note slices apart, HUD → ₹962.38 | Data ready |
| 05 | **Why ₹2,000 cannot trade** | Breakeven gap widens/narrows with capital | Data ready |
| 06 | **What losing looks like** | Real 2020 curve; *Hold or Sell?*; then recovery | Data ready |
| 07 | The 91% number | 100 figures, 91 fade out | Data ready |
| 08 | What actually works | SIP compounding, slow and boring, ends highest | Not started |

Ship order: **00, 04, 05** first. That is a complete story on its own and
tells you whether anyone cares before nine chapters get written.

---

## Design system

Light mode is warm paper; dark is deep ink. Marigold is the money colour,
chosen because it is warm, culturally at home in India, and nowhere near the
purple-gradient / acid-green defaults.

```
--marigold  #e08c1a  (light) / #f0a73c (dark)   money, the business, what's at stake
--teal      #0f766e  (light) / #4fd1c0 (dark)   your share, what you keep
--brick     #b03a2b  (light) / #e5796a (dark)   what costs and losses take
--bg        #faf7f2  (light) / #131316 (dark)
--ink       #1a1a1f  (light) / #f0ede8 (dark)
```

Full token set is in `prototype/chapter-00.html`. Port it to Tailwind theme
config + CSS variables; keep the three-block theme pattern (bare `:root`,
`prefers-color-scheme` guarded by `:root:not([data-theme="light"])`, and
`:root[data-theme="dark"]`) so the toggle wins both ways.

**Type**
- Display: **Instrument Serif** — editorial, warm, gives the story weight
- Body + Hindi: **Mukta** (Ek Type) — Devanagari and Latin designed together,
  so the language toggle does not change the page's texture
- Numbers: **IBM Plex Mono** — tabular, so the HUD does not jitter

---

## Content rules

### SEBI — these are hard constraints, not style preferences

1. **No price data under 30 days old.** From 1 July 2026, educational use of
   price data requires a 30-day lag. All data here is historical (2019–2025),
   which is well clear.
2. **Never name a security suggestively.** No "buy X", no price predictions,
   no implying future movement for any named stock.
3. **No performance claims.** The name is a hook; the content must deliver the
   opposite of a promise. If a sentence could be read as "do this and you'll
   be in the 9%", rewrite it.

Everything on this site is education. Nothing is advice. Say so in the footer.

### Hindi

Use natural spoken Hindi that **keeps English finance terms** — *token*,
*profit*, *business*, *brokerage*, *demat*. That is how Indians actually talk
about money. Pure शुद्ध हिंदी reads as a translation, not an explanation, and
is harder to understand, not easier.

**Tanish must review every Hindi string before launch.** He is the native
speaker; finance register is easy to get subtly wrong.

### Honesty

Chapter 00 includes a **monsoon beat** where the cart loses money and the HUD
falls from ₹4,400 to ₹3,400. This is deliberate and should not be cut. If
chapter 0 only shows gains it is a sales pitch, and everything after it reads
as a bait and switch. Ownership is not a one-way street, and the reader needs
that in scene one.

---

## Verified data in `data/`

**`cost-reference.json`** — generated from the Python cost engine in the
sibling `nse-backtester` repo. The TypeScript port in `src/lib/costs.ts`
**must reproduce these exactly**. Treat it as a test fixture and write a test
against it. Anchors:
- ₹1,000 round trip (10 shares @ ₹100) = **₹37.62**, of which ₹23.60 is the
  flat DP charge
- ₹2,000 breakeven move = **1.99%**

**`drawdown-2020.json`** — real equity curve of 49 large Indian companies held
in equal weight from Jan 2019. Used by chapter 06. Fell **28.02% in 42 days**
(11 Feb → 24 Mar 2020), recovered in 136 days, then gained **325% from that
bottom**. Selling at the trough would have cost everything that followed.

Note: this curve's *worst* drawdown is actually Feb 2023 (−38.7%), but that is
an artifact of the basket drifting into Adani Green before its crash, not a
market move. **Use the 2020 window, not 2023.** Teaching from 2023 would be
misleading.

---

## Chapter 00 prototype

`prototype/chapter-00.html` is standalone, no build step, and **verified in a
real browser** across five scroll positions in light, dark and at 390px width.
Open it directly to see the target behaviour.

### The bug that cost an hour — do not repeat it

A pinned scrollytelling section needs the **parent** to be taller than the
viewport so the sticky child has something to pin against:

```css
.scene {
  position: relative;
  --beats: 10;
  height: calc(var(--beats) * 88svh);  /* ← without this, nothing animates */
}
.scene-sticky { position: sticky; top: 0; height: 100svh; }
```

Without the parent height, scroll span is zero, progress never advances, and
**a screenshot looks completely fine**. Verify scroll scenes by scripting
actual scroll positions and asserting state changed, not by looking at them.

### Known rough edge

The isometric cart geometry is wonky — the canopy floats, the sign clips the
posts, the support posts barely read. It is recognisably a cart-ish structure,
not clearly a coffee cart. Refinement, not architecture. The iso projection
helper and box builder are sound and worth keeping.

---

## Setup

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint
npm i gsap @gsap/react lenis next-themes next-intl
```

Then port `prototype/chapter-00.html` into components. Keep its scene
behaviour and its design tokens; rewrite the scroll mechanics in GSAP.

## Repo layout (target)

```
src/
  app/[locale]/          chapters as routes
  chapters/              MDX content, en + hi
  scenes/                one component per scroll scene
  lib/costs.ts           TS port of the Python cost engine
  components/MoneyHud.tsx
data/                    verified fixtures (do not edit by hand)
prototype/               standalone verified prototypes
```

---

## Related work

Sibling repo `../nse-backtester` holds the research this site is built on: a
backtesting engine with full Indian statutory cost modelling, walk-forward
validation and leave-one-out robustness. Its headline finding — four strategy
classes tested, four negatives, and the one positive result turned out to be a
single stock — is the intellectual backbone of chapters 04 through 08.
