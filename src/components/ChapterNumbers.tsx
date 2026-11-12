import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { curveRows, numbersFor, sipRows, type Locale } from "@/lib/in-numbers";

type Chapter = "ch00" | "ch01" | "ch02" | "ch03" | "ch04" | "ch05" | "ch06" | "ch07" | "ch08";

/**
 * The figures each scene reveals, written out as server HTML after the outro.
 * Readers get a recap, and a crawler or answer engine that runs no JavaScript
 * gets the same numbers the scene animates. Always visible: never hide or clip
 * it, since text shown only to crawlers breaks Google's guidelines.
 *
 * A server component with a native <details>, so it adds no client JS.
 */
export function ChapterNumbers({ chapter }: { chapter: Chapter }) {
  const t = useTranslations("numbers");
  const locale = useLocale() as Locale;
  const values = numbersFor(chapter, locale);
  const count = (t.raw(chapter) as unknown[]).length;

  return (
    <section className="numbers gutter" aria-labelledby="numbers-heading" data-testid="in-numbers">
      <h2 id="numbers-heading">{t("heading")}</h2>
      <p className="numbers-note">{t("note")}</p>
      <dl className="numbers-list">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="numbers-item" data-testid="in-numbers-item">
            <dt>{t(`${chapter}.${i}.label`, values)}</dt>
            <dd>{t(`${chapter}.${i}.text`, values)}</dd>
          </div>
        ))}
      </dl>
      {chapter === "ch06" && <CurveTable locale={locale} values={values} />}
      {chapter === "ch08" && <SipTable values={values} />}
    </section>
  );
}

function SeeTheNumbers({ caption, children }: { caption: string; children: ReactNode }) {
  const t = useTranslations("numbers");
  return (
    <details className="doubt numbers-details" data-testid="see-numbers">
      <summary>{t("seeNumbers")}</summary>
      <div className="numbers-scroll">
        <table className="numbers-table">
          <caption>{caption}</caption>
          {children}
        </table>
      </div>
    </details>
  );
}

function CurveTable({ locale, values }: { locale: Locale; values: Record<string, string> }) {
  const t = useTranslations("numbers.table06");
  return (
    <SeeTheNumbers caption={t("caption", values)}>
      <thead>
        <tr>
          <th scope="col">{t("date")}</th>
          <th scope="col">{t("point")}</th>
          <th scope="col" className="num">{t("value")}</th>
          <th scope="col" className="num">{t("change", values)}</th>
        </tr>
      </thead>
      <tbody>
        {curveRows(locale).map((row) => (
          <tr key={row.date} data-kind={row.kind}>
            <td>{row.date}</td>
            <th scope="row">{t(`kinds.${row.kind}`, { year: row.year, depth: row.depth })}</th>
            <td className="num">{row.value}</td>
            <td className="num">{row.change}</td>
          </tr>
        ))}
      </tbody>
    </SeeTheNumbers>
  );
}

function SipTable({ values }: { values: Record<string, string> }) {
  const t = useTranslations("numbers.table08");
  return (
    <SeeTheNumbers caption={t("caption", values)}>
      <thead>
        <tr>
          <th scope="col">{t("year")}</th>
          <th scope="col" className="num">{t("putIn")}</th>
          <th scope="col" className="num">{t("value")}</th>
          <th scope="col" className="num">{t("growth")}</th>
        </tr>
      </thead>
      <tbody>
        {sipRows().map((row) => (
          <tr key={row.year}>
            <th scope="row">{row.year}</th>
            <td className="num">{row.putIn}</td>
            <td className="num">{row.value}</td>
            <td className="num">{row.growth}</td>
          </tr>
        ))}
      </tbody>
    </SeeTheNumbers>
  );
}
