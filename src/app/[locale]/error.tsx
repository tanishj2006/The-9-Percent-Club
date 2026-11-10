"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

/**
 * The likeliest failure on this site is a scene's chunk not arriving over a weak
 * mobile connection. React keeps a failed lazy import, so re-rendering cannot
 * fix that one: it needs a reload. Anything else gets a plain retry.
 */
const isChunkError = (error: Error) =>
  error.name === "ChunkLoadError" || /Loading (CSS )?chunk|dynamically imported module|import\(\)/i.test(error.message);

export default function ChapterError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("safety");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <section className="safety gutter" data-testid="error-page" role="alert">
        <p className="eyebrow">{t("errorEyebrow")}</p>
        <h1>{t("errorTitle")}</h1>
        <p className="safety-text">{t("errorText")}</p>
        <p className="safety-actions">
          <button
            type="button"
            className="safety-link"
            data-testid="retry"
            onClick={() => (isChunkError(error) ? window.location.reload() : reset())}
          >
            {t("retry")}
          </button>
          <Link href="/" className="safety-link safety-quiet" data-testid="back-home">
            {t("backHome")}
          </Link>
        </p>
      </section>
    </main>
  );
}
