"use client";

import Link from "next/link";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import "./globals.css";

/** If the locale layout itself fails, nothing localized is left to render with. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="safety gutter" role="alert">
          <h1>{en.safety.errorTitle}</h1>
          <p className="safety-text">{en.safety.errorText}</p>
          <h2 lang="hi">{hi.safety.errorTitle}</h2>
          <p className="safety-text" lang="hi">
            {hi.safety.errorText}
          </p>
          <p className="safety-actions">
            <button type="button" className="safety-link" onClick={() => reset()}>
              {en.safety.retry} / {hi.safety.retry}
            </button>
            <Link className="safety-link safety-quiet" href="/en">
              {en.safety.backHome}
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
