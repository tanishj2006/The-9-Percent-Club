"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ChapterSwitcher } from "./ChapterSwitcher";

export function Controls() {
  const t = useTranslations("site");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [, startTransition] = useTransition();

  const isHindi = locale === "hi";

  return (
    <div className="topbar">
      <button
        type="button"
        className="ctl"
        aria-label={t("toggleTheme")}
        data-testid="theme-toggle"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        ◐
      </button>
      <button
        type="button"
        className="ctl"
        aria-label={t("toggleLang")}
        aria-pressed={isHindi}
        data-testid="lang-toggle"
        onClick={() =>
          startTransition(() =>
            // scroll: false keeps the reader on the same beat.
            router.replace(pathname, {
              locale: isHindi ? "en" : "hi",
              scroll: false,
            }),
          )
        }
      >
        {isHindi ? "हिं" : "EN"}
      </button>
      <ChapterSwitcher />
    </div>
  );
}
