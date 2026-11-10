import { useTranslations } from "next-intl";

type Chapter = "ch00" | "ch01" | "ch02" | "ch03" | "ch04" | "ch05" | "ch06" | "ch07" | "ch08";

/**
 * Answers to the doubts a reader has at the end of a chapter, all written in
 * advance. Native <details> on a server component: instant, keyboard accessible,
 * working before hydration, and it adds no client JS.
 */
export function ChapterDoubts({
  chapter,
  values,
}: {
  chapter: Chapter;
  values?: Record<string, string>;
}) {
  const t = useTranslations("doubts");
  const count = (t.raw(chapter) as unknown[]).length;

  return (
    <section className="doubts gutter" aria-labelledby="doubts-heading" data-testid="doubts">
      <h2 id="doubts-heading">{t("heading")}</h2>
      <p className="doubts-note">{t("note")}</p>
      {Array.from({ length: count }, (_, i) => (
        <details key={i} className="doubt" data-testid="doubt">
          <summary>{t(`${chapter}.${i}.q`, values)}</summary>
          <p>{t(`${chapter}.${i}.a`, values)}</p>
        </details>
      ))}
    </section>
  );
}
