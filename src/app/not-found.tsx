import Link from "next/link";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import "./globals.css";

/**
 * A URL with no valid locale, such as /fr/04, never reaches a locale layout, so
 * this page cannot know the reader's language. It says it in both.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <main className="safety gutter" data-testid="not-found">
          <p className="eyebrow">404</p>
          <h1>{en.safety.notFoundTitle}</h1>
          <p className="safety-text">{en.safety.notFoundText}</p>
          <h2 lang="hi">{hi.safety.notFoundTitle}</h2>
          <p className="safety-text" lang="hi">
            {hi.safety.notFoundText}
          </p>
          <p className="safety-actions">
            <Link className="safety-link" href="/en">
              {en.safety.backHome}
            </Link>
            <Link className="safety-link" href="/hi" lang="hi">
              {hi.safety.backHome}
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
