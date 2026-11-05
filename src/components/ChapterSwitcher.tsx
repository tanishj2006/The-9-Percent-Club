"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { CHAPTERS } from "@/lib/chapters";

export function ChapterSwitcher() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex gap-1" data-testid="chapter-switcher">
      {CHAPTERS.map(({ number, href, titleKey }) => (
        <Link
          key={number}
          href={href}
          className="ctl"
          aria-label={t(titleKey)}
          aria-current={pathname === href ? "page" : undefined}
        >
          {number}
        </Link>
      ))}
    </nav>
  );
}
