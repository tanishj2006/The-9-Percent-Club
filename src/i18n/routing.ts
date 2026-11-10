import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hi"],
  defaultLocale: "en",
  // The pages carry their own hreflang links with absolute URLs. The
  // middleware's Link header would add a second set, built from the request
  // host and with an x-default of /04 rather than /en/04.
  alternateLinks: false,
});
