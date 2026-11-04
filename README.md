# The 9% Club

> Most traders lose money. Here's the arithmetic.

A scroll-driven, bilingual (English/Hindi) course that teaches an absolute
beginner what the Indian stock market actually is, starting from "what is a
share" and ending at what the evidence supports.

Built on the cost model and research findings from `nse-backtester`: every
figure about charges, breakeven and drawdown comes from a real engine, not
from a blog post.

## Status

| Chapter | State |
|---|---|
| 00 The cold coffee cart | Prototype built and verified |
| 01 Who buys your token? | Not started |
| 04 What a trade really costs | Data ready (cost engine verified) |
| 05 Why Rs 2,000 cannot trade | Data ready |
| 06 What losing looks like | Data ready (real 2020 drawdown curve) |

## Running it

The prototype is plain HTML with no build step. Open it directly:

    open prototype/chapter-00.html

## Approach

Scroll scenes are vanilla JS, not GSAP. A pinned section gets explicit extra
height (`--beats * 88svh`); scroll position within it becomes a 0..1 progress
value that drives every element in the scene. That keeps the payload small,
which matters because the audience is on Indian mobile data.

The persistent money HUD is the narrative spine. It starts at Rs 2,000 in
chapter 00 and carries through every chapter, so the reader watches their
money move rather than reading about it.

## Content rules

SEBI regulates investor education. Two hard rules this site follows:

1. **No price data under 30 days old.** From 1 July 2026 educational use of
   price data requires a 30-day lag. All data here is historical (2019-2025).
2. **No naming securities suggestively.** No "buy X", no price predictions,
   no implication of future movement for any named stock.

Everything here is education. Nothing is advice.
