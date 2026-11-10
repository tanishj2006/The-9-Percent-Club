import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { feedbackHref, ISSUES_URL, NEW_ISSUE_URL, PORTFOLIO_URL, REPO_URL, repoFile } from "./contact";
import { CONTACT_EMAIL } from "./site";

describe("feedback", () => {
  it("is a mailto to CONTACT_EMAIL with the subject filled in", () => {
    expect(feedbackHref()).toBe(`mailto:${CONTACT_EMAIL}?subject=The%209%25%20Club%3A%20correction%20or%20feedback`);
    const url = new URL(feedbackHref());
    expect(url.protocol).toBe("mailto:");
    expect(url.searchParams.get("subject")).toBe("The 9% Club: correction or feedback");
  });

  it("the address is written exactly once in src, in site.ts", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx|json|css)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
          const count = fs.readFileSync(full, "utf8").split(CONTACT_EMAIL).length - 1;
          for (let i = 0; i < count; i++) hits.push(path.relative(process.cwd(), full));
        }
      }
    };
    walk(path.join(process.cwd(), "src"));
    expect(hits).toEqual([path.join("src", "lib", "site.ts")]);
  });
});

describe("links", () => {
  it("point at the repo from git remote -v", () => {
    expect(REPO_URL).toBe("https://github.com/tanishj2006/The-9-Percent-Club");
    expect(ISSUES_URL).toBe(`${REPO_URL}/issues`);
    expect(repoFile("data/cost-reference.json")).toBe(`${REPO_URL}/blob/HEAD/data/cost-reference.json`);
  });

  it("a new issue opens the correction template, labelled correction", () => {
    const url = new URL(NEW_ISSUE_URL);
    expect(url.pathname).toBe("/tanishj2006/The-9-Percent-Club/issues/new");
    expect(url.searchParams.get("template")).toBe("correction.yml");
    expect(url.searchParams.get("labels")).toBe("correction");
    expect(fs.existsSync(path.join(process.cwd(), ".github/ISSUE_TEMPLATE/correction.yml"))).toBe(true);
  });

  it("the correction template asks for chapter, what is wrong and source", () => {
    const yml = fs.readFileSync(path.join(process.cwd(), ".github/ISSUE_TEMPLATE/correction.yml"), "utf8");
    for (const id of ["id: chapter", "id: wrong", "id: source"]) expect(yml).toContain(id);
    expect(yml).toContain('labels: ["correction"]');
  });

  it("the portfolio link carries its ref", () => {
    expect(PORTFOLIO_URL).toBe("https://tanishj-portfolio.vercel.app/?ref=9percentclub");
  });
});
