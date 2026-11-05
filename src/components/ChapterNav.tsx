import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CHAPTERS, type ChapterNumber } from "@/lib/chapters";

/** Previous / next at the foot of a chapter. `note` closes the course. */
export function ChapterNav({
  current,
  note,
}: {
  current: ChapterNumber;
  note?: "endNote";
}) {
  const t = useTranslations("nav");
  const i = CHAPTERS.findIndex((c) => c.number === current);
  const prev = CHAPTERS[i - 1];
  const next = CHAPTERS[i + 1];

  return (
    <nav className="chapter-nav gutter" aria-label={t("pager")} data-testid="chapter-nav">
      {note && <p className="chapter-nav-note">{t(note)}</p>}
      <div className="chapter-nav-links">
        {prev && (
          <Link href={prev.href} className="chapter-link" data-testid="prev-chapter">
            <span className="eyebrow">← {t("prev")}</span>
            <span className="font-display text-2xl">{t(prev.titleKey)}</span>
          </Link>
        )}
        {next && (
          <Link
            href={next.href}
            className="chapter-link ml-auto text-right"
            data-testid="next-chapter"
          >
            <span className="eyebrow">{t("next")} →</span>
            <span className="font-display text-2xl">{t(next.titleKey)}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
