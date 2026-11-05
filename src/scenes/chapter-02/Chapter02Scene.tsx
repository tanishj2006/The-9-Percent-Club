"use client";

import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useRef, type CSSProperties } from "react";
import { formatRupees, hudStore, STARTING_MONEY } from "@/lib/hud-store";
import { Beat, resolveBeats } from "../shared/Beat";
import { addBeats, BEAT_FADE, useScene } from "../shared/useScene";
import {
  ASKS,
  ASKS_BEAT,
  BEATS,
  BIDS,
  BIDS_BEAT,
  DEPLOYED,
  formatPrice,
  MATCH,
  MATCH_BEAT,
  MATCH_TIME,
  MATCHED_AT,
  noteAt,
  OPENING_LTP,
  QTY,
  SELLER_BEAT,
  SPREAD,
  VALUES,
  type Order,
} from "./story";

const W = 480;
const H = 262;
const MID = W / 2;
const ROW = 46;
const TOP = 46; // the first row, held empty for the two orders that meet
const BAR_H = 24;
const INNER = 80; // where bars start, leaving room for prices beside the middle
const SCALE = 130 / Math.max(...[...BIDS, ...ASKS].map((order) => order.qty));
const MEET = INNER;

const rowY = (row: number) => TOP + row * ROW;
const width = (qty: number) => Math.max(qty * SCALE, 8);

function Side({
  side,
  orders,
  label,
}: {
  side: "bid" | "ask";
  orders: Order[];
  label: (i: number) => string;
}) {
  const left = side === "bid";
  return (
    <>
      {orders.map((order, i) => {
        const w = width(order.qty);
        return (
          <g key={i} className="invisible" data-order={label(i)} data-side={side} data-price={order.price}>
            <rect
              className={left ? "book-bid" : "book-ask"}
              x={left ? MID - INNER - w : MID + INNER}
              y={rowY(i + 1) - BAR_H / 2}
              width={w}
              height={BAR_H}
              rx="3"
            />
            <text
              className="book-price"
              x={left ? MID - INNER + 6 : MID + INNER - 6}
              y={rowY(i + 1) + 5}
              textAnchor={left ? "start" : "end"}
            >
              {formatPrice(order.price)}
            </text>
          </g>
        );
      })}
    </>
  );
}

export default function Chapter02Scene() {
  const t = useTranslations("ch02");
  const beats = resolveBeats(t, VALUES);
  const scope = useRef<HTMLElement>(null);

  useScene(scope, () => {
    const select = gsap.utils.selector(scope.current);

    const beatEls = select("[data-testid=beat]");
    const bids = select('[data-side="bid"]');
    const asks = select('[data-side="ask"]');
    const seller = select("[data-testid=order-seller]")[0];
    const buyer = select("[data-testid=order-you]")[0];
    const matchLabels = select("[data-match-label]");
    const ltp = select("[data-testid=ltp]")[0];
    const gap = select("[data-testid=spread]")[0];

    const hud = (matched: boolean) =>
      hudStore.set({
        money: STARTING_MONEY,
        settled: STARTING_MONEY,
        note: noteAt(matched),
        noteValue: matched ? formatRupees(DEPLOYED) : undefined,
      });

    return {
      sync(progress) {
        const matched = progress >= MATCHED_AT;
        const inside = progress >= SELLER_BEAT / BEATS - BEAT_FADE && !matched;
        ltp.textContent = formatPrice(matched ? MATCH : OPENING_LTP);
        gap.textContent = formatRupees(inside ? SPREAD / 2 : SPREAD, true);
        hud(matched);
      },

      build(tl) {
        addBeats(tl, beatEls);

        const at = (beat: number) => beat / BEATS;

        bids.forEach((order, i) => {
          tl.fromTo(order, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.012 }, at(BIDS_BEAT) + i * 0.014);
        });
        asks.forEach((order, i) => {
          tl.fromTo(order, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.012 }, at(ASKS_BEAT) + i * 0.014);
        });

        tl.fromTo(seller, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(SELLER_BEAT) - BEAT_FADE);
        tl.fromTo(buyer, { autoAlpha: 0 }, { autoAlpha: 1, duration: BEAT_FADE }, at(MATCH_BEAT) - BEAT_FADE);

        // The two orders meet in the middle, and the trade clears them both.
        tl.to(matchLabels, { autoAlpha: 0, duration: BEAT_FADE }, at(MATCH_BEAT));
        tl.to(seller, { x: -MEET, duration: MATCH_TIME }, at(MATCH_BEAT));
        tl.to(buyer, { x: MEET, duration: MATCH_TIME }, at(MATCH_BEAT));
        tl.to([seller, buyer], { autoAlpha: 0, duration: BEAT_FADE }, MATCHED_AT);
      },

      reduced() {
        gsap.set([...beatEls, ...bids, ...asks], { autoAlpha: 1 });
        ltp.textContent = formatPrice(MATCH);
        gap.textContent = formatRupees(SPREAD, true);
      },

      onReach(reached) {
        hud(reached);
      },
    };
  });

  const seller = width(QTY);

  return (
    <section
      className="scene"
      ref={scope}
      data-testid="scene"
      style={{ "--beats": BEATS } as CSSProperties}
    >
      <div className="rail" data-testid="rail" />
      <div className="scene-sticky" data-testid="scene-sticky">
        <div className="stage gutter">
          <div className="stage-inner stage-single">
            <div className="book-chart" data-fit>
              <div className="readout readout-book">
                <span className="book-stat">
                  {t("ltpLabel")} <span className="book-ltp" data-testid="ltp">{formatPrice(OPENING_LTP)}</span>
                </span>
                <span className="book-stat">
                  {t("gapLabel")} <span data-testid="spread">{formatRupees(SPREAD, true)}</span>
                </span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("bookAlt", VALUES)} data-testid="book">
                <text className="book-head" x={MID - INNER} y="14" textAnchor="end">{t("buyers")}</text>
                <text className="book-head" x={MID + INNER} y="14">{t("sellers")}</text>
                <line x1={MID} x2={MID} y1="24" y2={H} className="book-spread" />
                <Side side="bid" orders={BIDS} label={(i) => `bid-${i}`} />
                <Side side="ask" orders={ASKS} label={(i) => `ask-${i}`} />

                <g data-testid="order-you" className="invisible">
                  <rect className="book-bid" x={MID - INNER - seller} y={rowY(0) - BAR_H / 2} width={seller} height={BAR_H} rx="3" />
                  <text data-match-label className="book-price" x={MID - INNER + 6} y={rowY(0) + 5}>{formatPrice(MATCH)}</text>
                  <text data-match-label className="book-who" x={MID - INNER - seller - 6} y={rowY(0) + 5} textAnchor="end">{t("you")}</text>
                </g>
                <g data-testid="order-seller" className="invisible">
                  <rect className="book-ask" x={MID + INNER} y={rowY(0) - BAR_H / 2} width={seller} height={BAR_H} rx="3" />
                  <text data-match-label className="book-price" x={MID + INNER - 6} y={rowY(0) + 5} textAnchor="end">{formatPrice(MATCH)}</text>
                  <text data-match-label className="book-who" x={MID + INNER + seller + 6} y={rowY(0) + 5}>{t("hurry")}</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
        <div className="caption gutter">
          {beats.map((beat, i) => (
            <Beat key={i} beat={beat} />
          ))}
        </div>
      </div>
    </section>
  );
}
