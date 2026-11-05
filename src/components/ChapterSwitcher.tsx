"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { CHAPTERS } from "@/lib/chapters";

export function ChapterSwitcher() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  // Remembers which page the menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const current = CHAPTERS.find((c) => c.href === pathname);

  return (
    <nav
      aria-label={t("label")}
      className="chapter-switcher"
      data-open={open}
      data-testid="chapter-switcher"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpenOn(null);
      }}
    >
      <button
        type="button"
        className="ctl chapter-toggle"
        aria-expanded={open}
        aria-controls="chapter-list"
        aria-label={t("label")}
        data-testid="chapter-toggle"
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        {current?.number} ▾
      </button>
      <ul className="chapter-list" id="chapter-list">
        {CHAPTERS.map(({ number, href, titleKey }) => (
          <li key={number}>
            <Link
              href={href}
              className="ctl"
              aria-label={t(titleKey)}
              aria-current={pathname === href ? "page" : undefined}
            >
              <span>{number}</span>
              <span className="chapter-title">{t(titleKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
