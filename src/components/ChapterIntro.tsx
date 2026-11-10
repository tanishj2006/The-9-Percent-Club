import { useTranslations } from "next-intl";

/** The opening section every chapter shares: eyebrow, title, tagline, scroll cue. */
export function ChapterIntro({
  chapter,
  values,
  id,
}: {
  chapter: string;
  values?: Record<string, string>;
  /** An anchor target, for the home hero's "Start chapter 00". */
  id?: string;
}) {
  const t = useTranslations(chapter);

  return (
    <section className="intro gutter" id={id} data-testid="chapter-intro">
      <div className="eyebrow">{t("ch")}</div>
      <h1>{t.rich("title", { br: () => <br /> })}</h1>
      <p className="mt-[1.4rem] max-w-[30rem] text-xl text-ink-soft">
        {t("tagline", values)}
      </p>
      <div className="scroll-cue" data-testid="scroll-cue">
        <span className="scroll-cue-bar" />
        <span>{t("scrollCue")}</span>
      </div>
    </section>
  );
}
