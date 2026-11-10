/**
 * The optional support page. It exists only when both variables are set at build
 * time, so a fork or a preview without them has no page, no footer link and no
 * sitemap entry.
 */

const VPA = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

export function upiConfig(
  id = process.env.NEXT_PUBLIC_UPI_ID,
  name = process.env.NEXT_PUBLIC_UPI_NAME,
) {
  const pa = id?.trim();
  const pn = name?.trim();
  // A malformed ID would send money nowhere useful, so treat it as unset.
  if (!pa || !pn || !VPA.test(pa)) return null;
  return { pa, pn };
}

/** The deep link UPI apps open. The ID is sent as-is; the name is encoded. */
export function upiLink(config: { pa: string; pn: string }) {
  return `upi://pay?pa=${config.pa}&pn=${encodeURIComponent(config.pn)}&cu=INR`;
}

export const SUPPORT_ENABLED = upiConfig() !== null;
