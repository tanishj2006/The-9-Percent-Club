import type { ReactNode } from "react";
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

/** A link to the author: email when an address is configured, else GitHub issues. */
export function ContactLink({
  feedback,
  issues,
  emailLabel,
  issuesLabel,
}: {
  feedback: string | null;
  issues: string;
  emailLabel: string;
  issuesLabel: string;
}) {
  return feedback ? (
    <a href={feedback} data-testid="contact-link">
      {emailLabel}
    </a>
  ) : (
    <a href={issues} data-testid="contact-link">
      {issuesLabel}
    </a>
  );
}
