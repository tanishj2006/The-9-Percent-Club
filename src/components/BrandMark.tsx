import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** The 9% badge and wordmark, linking home to Chapter 00. */
export function BrandMark() {
  const t = useTranslations("site");

  return (
    <Link href="/" className="brand" aria-label={t("home")} data-testid="brand" data-header-item>
      <svg className="brand-badge" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="var(--marigold)" />
        <text
          x="14"
          y="18.4"
          textAnchor="middle"
          fill="#1a1a1f"
          fontFamily="var(--font-plex-mono), ui-monospace, monospace"
          fontSize="11.5"
          fontWeight="600"
          letterSpacing="-0.4"
        >
          9%
        </text>
      </svg>
      <span className="brand-name">{t("name")}</span>
    </Link>
  );
}
