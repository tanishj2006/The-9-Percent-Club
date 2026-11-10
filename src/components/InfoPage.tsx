import type { ReactNode } from "react";
import { feedbackHref, NEW_ISSUE_URL } from "@/lib/contact";
import { ChapterStart } from "./ChapterStart";

/** The shared frame for About, Methodology, Terms and Privacy. */
export function InfoPage({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <main>
      <ChapterStart />
      <article className="info gutter" data-testid={testId}>
        {children}
      </article>
    </main>
  );
}

/** "Email me", then a smaller "or open an issue on GitHub". The same pair everywhere. */
export function ContactLinks({ email, issue }: { email: string; issue: string }) {
  return (
    <span className="contact-links">
      <a href={feedbackHref()} data-testid="contact-email">
        {email}
      </a>{" "}
      <a href={NEW_ISSUE_URL} className="contact-issue" data-testid="contact-issue">
        {issue}
      </a>
    </span>
  );
}
