import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

// Generated once per deploy. RFC 9116 asks for an Expires under a year away;
// 180 days means a deploy at least every six months keeps it current.
export const dynamic = "force-static";

const DAY = 24 * 60 * 60 * 1000;

export function GET() {
  const expires = new Date(Date.now() + 180 * DAY).toISOString();
  const body = [
    `Contact: mailto:${CONTACT_EMAIL}`,
    `Expires: ${expires}`,
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    "Preferred-Languages: en, hi",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
