import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CHAPTERS } from "@/lib/chapters";
import { KEPT, LOST, TRADERS } from "@/scenes/chapter-07/story";

const CELL = 22;

/**
 * The site's own first screen, on Chapter 00's route: name and tagline, the
 * meta line, a static picture of SEBI's FY25 count, and a plain anchor down to
 * Chapter 00. Server-rendered HTML and SVG, so it adds no JavaScript and needs
 * nothing special for reduced motion.
 */
export function HomeHero() {
  const t = useTranslations("home");
  const site = useTranslations("site");

  return (
    <section className="hero gutter" data-testid="hero">
      <div className="hero-brand" data-testid="hero-brand">
        <p className="hero-name">{site("name")}</p>
        <p className="hero-tagline">{site("tagline")}</p>
        <p className="hero-meta" data-testid="hero-meta">
          {t("meta")}
        </p>
        <a href="#chapter-00" className="hero-start-button" data-testid="hero-start">
          {t("start")}
          <span aria-hidden="true"> ↓</span>
        </a>
      </div>

      <figure className="hero-figure" data-testid="hero-figure">
        <svg
          viewBox={`0 0 ${CELL * 10} ${CELL * 10}`}
          role="img"
          aria-label={t("gridAlt", { lost: LOST, kept: TRADERS - LOST })}
        >
          {Array.from({ length: TRADERS }, (_, i) => (
            <g
              key={i}
              className="hero-person"
              data-lost={KEPT.includes(i) ? undefined : true}
              transform={`translate(${(i % 10) * CELL} ${Math.floor(i / 10) * CELL})`}
            >
              <circle cx="11" cy="6.5" r="3.6" />
              <path d="M4.5 19.5c0-5.4 2.6-9.2 6.5-9.2s6.5 3.8 6.5 9.2z" />
            </g>
          ))}
        </svg>
        <figcaption>{t("gridCaption", { lost: LOST })}</figcaption>
      </figure>
    </section>
  );
}

/** All nine chapters as small links, for readers coming back. Directly under the hero. */
export function ChapterMap() {
  const t = useTranslations("home");
  const nav = useTranslations("nav");

  return (
    <nav className="chapter-map gutter" aria-labelledby="chapter-map-heading" data-testid="chapter-map">
      <h2 id="chapter-map-heading" className="eyebrow">
        {t("mapHeading")}
      </h2>
      <ol>
        {CHAPTERS.map(({ number, href, titleKey }) => (
          <li key={number}>
            <Link href={href} aria-current={href === "/" ? "page" : undefined}>
              <span className="chapter-map-number">{number}</span>
              <span>{nav(titleKey)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
