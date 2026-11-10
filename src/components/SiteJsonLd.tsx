import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Who publishes the site, as schema.org JSON-LD. It names the author and the
 * site only: no dates, ratings or claims, so it cannot say more than the page.
 * dateModified waits for a visible "last reviewed" date on each chapter.
 */
export function SiteJsonLd({ locale, description }: { locale: string; description: string }) {
  const author = {
    "@type": "Person",
    "@id": `${SITE_URL}/#author`,
    name: "Tanish Jain",
    email: `mailto:${CONTACT_EMAIL}`,
  };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      author,
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/${locale}#website`,
        url: `${SITE_URL}/${locale}`,
        name: SITE_NAME,
        description,
        inLanguage: locale === "hi" ? "hi-IN" : "en-IN",
        publisher: { "@id": author["@id"] },
      },
    ],
  };

  // Escape "<" so no string in the data can close the script element.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
