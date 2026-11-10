import { CONTACT_EMAIL } from "./site";

/** Where readers reach the author: email first, a public GitHub issue second. */
export const REPO_URL = "https://github.com/tanishj2006/The-9-Percent-Club";
export const ISSUES_URL = `${REPO_URL}/issues`;
export const PORTFOLIO_URL = "https://tanishj-portfolio.vercel.app/?ref=9percentclub";

/** A file in the repo, on whatever its default branch is. */
export const repoFile = (path: string) => `${REPO_URL}/blob/HEAD/${path}`;

/** Email to the author, with the subject filled in. */
export const FEEDBACK_SUBJECT = "The 9% Club: correction or feedback";
export const feedbackHref = () => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}`;

/** A new GitHub issue from the correction template, labelled "correction". */
export const NEW_ISSUE_URL = `${REPO_URL}/issues/new?template=correction.yml&labels=correction`;
