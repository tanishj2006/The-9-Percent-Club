import { NextIntlClientProvider, useMessages } from "next-intl";
import type { ReactNode } from "react";
import { CHAPTERS } from "@/lib/chapters";

/**
 * Hands client components only this chapter's copy, so a reader on chapter 00
 * does not receive chapter 05's strings in the page payload.
 */
export function ChapterMessages({
  chapter,
  children,
}: {
  chapter: (typeof CHAPTERS)[number]["titleKey"];
  children: ReactNode;
}) {
  const { site, nav, [chapter]: copy } = useMessages();

  return (
    <NextIntlClientProvider messages={{ site, nav, [chapter]: copy }}>
      {children}
    </NextIntlClientProvider>
  );
}
