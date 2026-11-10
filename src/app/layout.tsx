import type { ReactNode } from "react";

/**
 * The real root layout is app/[locale]/layout.tsx, which owns <html>. This one
 * exists only so app/not-found.tsx can catch a URL with no valid locale.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
