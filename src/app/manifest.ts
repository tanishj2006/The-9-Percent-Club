import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

// Colours are the light theme's --bg and --marigold from globals.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: Most traders lose money. Here's the arithmetic.`,
    short_name: SITE_NAME,
    start_url: "/",
    display: "browser",
    background_color: "#faf7f2",
    theme_color: "#e08c1a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
