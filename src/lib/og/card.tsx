import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";
import { CHAPTERS, type ChapterNumber } from "@/lib/chapters";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import { SITE_NAME } from "@/lib/site";
import { textImage, type OgFont } from "./shape";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";
export const OG_ALT = `${SITE_NAME}: ${en.site.tagline}`;

export const ogLocales = () => routing.locales.map((locale) => ({ locale }));

const INK = "#131316";
const PAPER = "#f0ede8";
const SOFT = "#a9a4b0";
const MARIGOLD = "#f0a73c";
const PAD = 76;
const WIDTH = OG_SIZE.width - PAD * 2;

/** Picks a title size that holds the longest chapter title to two lines. */
function fitTitle(text: string, font: OgFont) {
  for (const size of [92, 82, 72, 64]) {
    const image = textImage({ text, font, size, color: PAPER, maxWidth: WIDTH, lineHeight: 1.18 });
    if (image.lines <= 2) return image;
  }
  return textImage({ text, font, size: 56, color: PAPER, maxWidth: WIDTH, lineHeight: 1.18 });
}

function Line({ image }: { image: ReturnType<typeof textImage> }) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img src={image.src} width={image.width} height={image.height} />;
}

/** The 1200×630 card shown when a chapter link is shared. */
export function chapterCard(locale: string, number: ChapterNumber) {
  const { titleKey } = CHAPTERS.find((chapter) => chapter.number === number)!;
  const hindi = locale === "hi";
  const copy = hindi ? hi : en;

  const name = textImage({ text: SITE_NAME, font: "display", size: 46, color: MARIGOLD, maxWidth: WIDTH });
  const eyebrow = textImage({
    text: copy[titleKey].ch,
    font: "body",
    size: 34,
    color: SOFT,
    maxWidth: WIDTH,
  });
  const title = fitTitle(copy.nav[titleKey], hindi ? "strong" : "display");
  const tagline = textImage({
    text: copy.site.tagline,
    font: "body",
    size: 34,
    color: PAPER,
    maxWidth: WIDTH,
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: PAD,
          background: INK,
          borderTop: `10px solid ${MARIGOLD}`,
        }}
      >
        <Line image={name} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Line image={eyebrow} />
          <Line image={title} />
        </div>
        <Line image={tagline} />
      </div>
    ),
    OG_SIZE,
  );
}
