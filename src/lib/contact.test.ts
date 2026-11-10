import { describe, expect, it } from "vitest";
import { feedbackHref, ISSUES_URL, PORTFOLIO_URL, REPO_URL, repoFile } from "./contact";

describe("feedback", () => {
  it("is hidden when no contact address is configured", () => {
    expect(feedbackHref(undefined)).toBeNull();
    expect(feedbackHref("")).toBeNull();
    expect(feedbackHref("   ")).toBeNull();
  });

  it("is a mailto link when one is", () => {
    expect(feedbackHref("hello@example.com")).toBe("mailto:hello@example.com?subject=The%209%25%20Club");
  });

  it("the code hard-codes no address", () => {
    expect(JSON.stringify({ REPO_URL, ISSUES_URL, PORTFOLIO_URL })).not.toMatch(/@/);
  });
});

describe("links", () => {
  it("point at the repo from git remote -v", () => {
    expect(REPO_URL).toBe("https://github.com/tanishj2006/The-9-Percent-Club");
    expect(ISSUES_URL).toBe(`${REPO_URL}/issues`);
    expect(repoFile("data/cost-reference.json")).toBe(`${REPO_URL}/blob/HEAD/data/cost-reference.json`);
  });

  it("the portfolio link carries its ref", () => {
    expect(PORTFOLIO_URL).toBe("https://tanishj-portfolio.vercel.app/?ref=9percentclub");
  });
});
