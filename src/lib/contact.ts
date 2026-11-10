/**
 * Where readers reach the author. The address comes from the environment and is
 * never written into the code: without it, the Feedback link is hidden and the
 * pages that need a contact point to GitHub issues instead.
 */
export const REPO_URL = "https://github.com/tanishj2006/The-9-Percent-Club";
export const ISSUES_URL = `${REPO_URL}/issues`;
export const PORTFOLIO_URL = "https://tanishj-portfolio.vercel.app/?ref=9percentclub";

/** A file in the repo, on whatever its default branch is. */
export const repoFile = (path: string) => `${REPO_URL}/blob/HEAD/${path}`;

export function feedbackHref(email = process.env.NEXT_PUBLIC_CONTACT_EMAIL) {
  const address = email?.trim();
  return address ? `mailto:${address}?subject=${encodeURIComponent("The 9% Club")}` : null;
}
