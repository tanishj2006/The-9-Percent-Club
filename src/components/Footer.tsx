import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { feedbackHref, PORTFOLIO_URL, REPO_URL } from "@/lib/contact";

/**
 * Server component: brand and tagline, the disclaimer, the trust pages, and who
 * built it. The language switch stays in the fixed header, reachable from here
 * and everywhere else. No client JS, no third-party anything.
 */
export function Footer() {
  const site = useTranslations("site");
  const t = useTranslations("footer");
  const feedback = feedbackHref();

  return (
    <footer className="site-footer gutter" data-testid="site-footer">
      <div className="footer-inner">
        <p className="footer-brand">
          <span className="footer-name">{site("name")}</span>
          <span className="footer-tagline">{site("tagline")}</span>
        </p>

        <p className="footer-disclaimer">
          {t("disclaimer")}{" "}
          <Link href="/terms" className="footer-inline">
            {t("readDisclaimer")}
          </Link>
        </p>

        <nav aria-label={t("label")}>
          <ul className="footer-links">
            <li>
              <Link href="/about">{t("about")}</Link>
            </li>
            <li>
              <Link href="/methodology">{t("methodology")}</Link>
            </li>
            <li>
              <Link href="/terms">{t("terms")}</Link>
            </li>
            <li>
              <Link href="/privacy">{t("privacy")}</Link>
            </li>
            {feedback && (
              <li>
                <a href={feedback} data-testid="feedback">
                  {t("feedback")}
                </a>
              </li>
            )}
            <li>
              <a href={REPO_URL} data-testid="source">
                {t("source")}
              </a>
            </li>
          </ul>
        </nav>

        <div className="footer-bottom">
          <p className="footer-copyright">{t("copyright")}</p>
          <a
            className="built-by"
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener"
            data-testid="built-by"
          >
            <span className="built-by-text">{t("builtBy")}</span>
            <span className="built-by-arrow" aria-hidden="true">
              ↗
            </span>
            <span className="sr-only">{t("newTab")}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
