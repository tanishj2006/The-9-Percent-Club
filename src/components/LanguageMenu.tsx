"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Chevron } from "./ChapterMenu";
import { useMenu } from "./useMenu";

/** Each language is named in its own script, as language menus usually are. */
const NAMES: Record<string, { short: string; full: string }> = {
  en: { short: "English", full: "English" },
  hi: { short: "हिंदी", full: "हिंदी (Hindi)" },
};

export function LanguageMenu() {
  const t = useTranslations("site");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const menu = useMenu();

  const choose = (next: string) => {
    menu.close();
    menu.trigger.current?.focus();
    if (next === locale) return;
    startTransition(() =>
      // scroll: false keeps the reader on the same beat.
      router.replace(pathname, { locale: next, scroll: false }),
    );
  };

  return (
    <div
      className="menu language-menu"
      ref={menu.root}
      data-open={menu.open}
      onKeyDown={menu.onKeyDown}
      onBlur={menu.onBlur}
    >
      <button
        ref={menu.trigger}
        type="button"
        className="menu-trigger language-trigger"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-controls="language-menu-list"
        aria-label={`${t("language")}: ${NAMES[locale].full}`}
        data-testid="lang-toggle"
        data-header-item
        onClick={menu.toggle}
      >
        <Globe />
        <span className="language-trigger-name">{NAMES[locale].short}</span>
        <Chevron />
      </button>

      <div className="menu-card language-card" hidden={!menu.open}>
        <ul id="language-menu-list" className="menu-list" role="menu" aria-label={t("language")}>
          {routing.locales.map((option) => (
            <li key={option} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={option === locale}
                lang={option}
                className="menu-item language-item"
                data-menu-item
                data-testid={`lang-${option}`}
                onClick={() => choose(option)}
              >
                <span>{NAMES[option].full}</span>
                <Check />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Globe() {
  return (
    <svg className="icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="8" cy="8" r="6.2" />
        <path d="M1.8 8h12.4M8 1.8c1.9 2 2.8 4 2.8 6.2S9.9 12.2 8 14.2M8 1.8C6.1 3.8 5.2 5.8 5.2 8s.9 4.2 2.8 6.2" />
      </g>
    </svg>
  );
}

function Check() {
  return (
    <svg className="check" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="m3 7.2 2.6 2.6L11 4.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
