"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

/**
 * One static icon, half paper and half ink, so the server and the client render
 * the same thing before next-themes knows which theme is active.
 */
export function ThemeToggle() {
  const t = useTranslations("site");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={t("toggleTheme")}
      data-testid="theme-toggle"
      data-header-item
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <svg className="icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" />
      </svg>
    </button>
  );
}
