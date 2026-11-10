"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { CHAPTERS } from "@/lib/chapters";
import { useMenu } from "./useMenu";

/** The table of contents: one pill naming where you are, opening onto all nine. */
export function ChapterMenu() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const menu = useMenu();

  const index = Math.max(
    CHAPTERS.findIndex((c) => c.href === pathname),
    0,
  );
  const current = CHAPTERS[index];

  return (
    <nav
      aria-label={t("label")}
      className="menu chapter-menu"
      ref={menu.root}
      data-open={menu.open}
      data-testid="chapter-switcher"
      onKeyDown={menu.onKeyDown}
      onBlur={menu.onBlur}
    >
      <button
        ref={menu.trigger}
        type="button"
        className="menu-trigger chapter-trigger"
        aria-expanded={menu.open}
        aria-controls="chapter-menu-list"
        data-testid="chapter-toggle"
        data-header-item
        onClick={menu.toggle}
      >
        <span className="chapter-trigger-number">{t("short", { number: current.number })}</span>
        <span className="chapter-trigger-title">
          <span aria-hidden="true"> · </span>
          {t(current.titleKey)}
        </span>
        <span className="chapter-trigger-step">
          {t("step", { current: index + 1, total: CHAPTERS.length })}
        </span>
        <Chevron />
      </button>

      <div className="menu-card chapter-card" hidden={!menu.open}>
        <p className="menu-heading">{t("label")}</p>
        <ul id="chapter-menu-list" className="menu-list">
          {CHAPTERS.map(({ number, href, titleKey }) => (
            <li key={number}>
              <Link
                href={href}
                className="menu-item chapter-item"
                aria-current={pathname === href ? "page" : undefined}
                data-menu-item
                onClick={menu.close}
              >
                <span className="chapter-item-number">{number}</span>
                <span>{t(titleKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function Chevron() {
  return (
    <svg className="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
