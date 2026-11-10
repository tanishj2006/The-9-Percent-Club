import { useTranslations } from "next-intl";
import { ChapterMap } from "@/components/HomeHero";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("safety");

  return (
    <main>
      <section className="safety gutter" data-testid="not-found">
        <p className="eyebrow">404</p>
        <h1>{t("notFoundTitle")}</h1>
        <p className="safety-text">{t("notFoundText")}</p>
        <p className="safety-actions">
          <Link href="/" className="safety-link" data-testid="back-home">
            {t("backHome")}
          </Link>
        </p>
      </section>
      <ChapterMap />
    </main>
  );
}
