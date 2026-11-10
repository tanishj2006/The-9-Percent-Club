import { chapterCard, OG_ALT, OG_SIZE, OG_TYPE, ogLocales } from "@/lib/og/card";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_TYPE;

// Rendered once at build time, so previews are instant and no font files are
// needed at runtime.
export function generateStaticParams() {
  return ogLocales();
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return chapterCard(locale, "04");
}
