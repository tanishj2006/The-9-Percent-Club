import { expect, test } from "@playwright/test";
import { STORED } from "../src/lib/privacy";
import { CONTACT_EMAIL } from "../src/lib/site";
import { open, switchLanguage } from "./helpers";

const MAILTO = new RegExp(`^mailto:${CONTACT_EMAIL.replace(/[.]/g, "\\.")}`);

test.skip(process.env.E2E_DEV === "1", "production behaviour");

const PAGES = ["about", "methodology", "terms", "privacy"] as const;
const SITE = "https://e2e.example";

test.describe("the four trust pages", () => {
  for (const name of PAGES) {
    for (const locale of ["en", "hi"] as const) {
      test(`/${locale}/${name}: 200, one h1, its own metadata`, async ({ page }) => {
        const response = await page.goto(`/${locale}/${name}`);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.getByTestId(name)).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/${locale}/${name}`);
        await expect(page.locator('link[hreflang="en"]')).toHaveAttribute("href", `${SITE}/en/${name}`);
        await expect(page.locator('link[hreflang="hi"]')).toHaveAttribute("href", `${SITE}/hi/${name}`);
        await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute("href", `${SITE}/en/${name}`);
        await expect(page).toHaveTitle(/The 9% Club/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{30,}/);
        await expect(page.locator("body")).not.toContainText(/\{[a-zA-Z0-9]+\}/);
      });
    }
  }

  test("each page has its own title within a language", async ({ request }) => {
    for (const locale of ["en", "hi"]) {
      const titles = new Set<string>();
      for (const name of PAGES) {
        const html = await (await request.get(`/${locale}/${name}`)).text();
        titles.add(html.match(/<title>([^<]+)<\/title>/)![1]);
      }
      expect(titles.size, locale).toBe(4);
    }
  });

  test("the header does not claim you are in Chapter 00", async ({ page }) => {
    await page.goto("/en/about");
    await expect(page.getByTestId("chapter-toggle")).toContainText("Chapters");
    await expect(page.getByTestId("chapter-toggle")).not.toContainText("Ch 00");
  });

  test("the language switch still works on them", async ({ page }) => {
    await open(page, "/en");
    await page.goto("/en/privacy");
    await switchLanguage(page, "hi");
    await expect(page).toHaveURL(/\/hi\/privacy$/);
    await expect(page.locator("h1")).toHaveText("Privacy");
  });
});

test.describe("footer", () => {
  test("brand and tagline together, then the disclaimer linking to the terms", async ({ page }) => {
    await page.goto("/en/04");
    const footer = page.getByTestId("site-footer");
    await expect(footer.locator(".footer-name")).toHaveText("The 9% Club");
    await expect(footer.locator(".footer-tagline")).toHaveText("Most traders lose money. Here's the arithmetic.");
    await expect(footer.locator(".footer-disclaimer")).toContainText("not a SEBI-registered investment adviser or research analyst");
    await footer.getByRole("link", { name: "Read the disclaimer" }).click();
    await expect(page).toHaveURL(/\/en\/terms$/);
  });

  test("every footer link resolves", async ({ page, request }) => {
    for (const locale of ["en", "hi"]) {
      await page.goto(`/${locale}`);
      const hrefs = await page.getByTestId("site-footer").locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
      for (const href of hrefs) {
        if (href.startsWith("/")) {
          expect((await request.get(href)).status(), href).toBe(200);
        } else if (href.startsWith("mailto:")) {
          expect(href).toBe(`mailto:${CONTACT_EMAIL}?subject=The%209%25%20Club%3A%20correction%20or%20feedback`);
        } else {
          expect([
            "https://github.com/tanishj2006/The-9-Percent-Club",
            "https://github.com/tanishj2006/The-9-Percent-Club/issues/new?template=correction.yml&labels=correction",
            "https://tanishj-portfolio.vercel.app/?ref=9percentclub",
          ]).toContain(href);
        }
      }
      for (const page_ of ["about", "methodology", "terms", "privacy"]) {
        expect(hrefs).toContain(`/${locale}/${page_}`);
      }
    }
  });

  test("the link row, then the two ways to report a mistake", async ({ page }) => {
    await page.goto("/en");
    const footer = page.getByTestId("site-footer");
    const labels = await footer.locator(".footer-links a").allTextContents();
    expect(labels).toEqual(["About", "Methodology and sources", "Disclaimer and terms", "Privacy", "Source on GitHub"]);
    await expect(page.getByTestId("source")).toHaveAttribute("href", "https://github.com/tanishj2006/The-9-Percent-Club");
    const email = page.getByTestId("feedback");
    await expect(email).toHaveText("Found a mistake? Email me");
    const url = new URL((await email.getAttribute("href"))!);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe(CONTACT_EMAIL);
    expect(url.searchParams.get("subject")).toBe("The 9% Club: correction or feedback");
    const issue = page.getByTestId("feedback-issue");
    await expect(issue).toHaveText("or open an issue on GitHub");
    const issueUrl = new URL((await issue.getAttribute("href"))!);
    expect(issueUrl.pathname).toBe("/tanishj2006/The-9-Percent-Club/issues/new");
    expect(issueUrl.searchParams.get("labels")).toBe("correction");
    expect(issueUrl.searchParams.get("template")).toBe("correction.yml");
    const [emailSize, issueSize] = await Promise.all([email, issue].map((l) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))));
    expect(issueSize, "the GitHub link is the smaller of the two").toBeLessThan(emailSize);
  });

  test("Hindi: the same two links, in Hindi", async ({ page }) => {
    await page.goto("/hi");
    await expect(page.getByTestId("feedback")).toHaveText("कोई गलती दिखी? मुझे email करें");
    await expect(page.getByTestId("feedback-issue")).toHaveText("या GitHub पर issue खोलें");
    await expect(page.getByTestId("feedback")).toHaveAttribute("href", new RegExp(`${MAILTO.source}\\?subject=`));
  });

  test("About, Methodology and Privacy use the same pair of links", async ({ page }) => {
    for (const name of ["about", "methodology", "privacy"]) {
      await page.goto(`/en/${name}`);
      const main = page.getByTestId(name);
      await expect(main.getByTestId("contact-email"), name).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}?subject=The%209%25%20Club%3A%20correction%20or%20feedback`);
      await expect(main.getByTestId("contact-issue"), name).toHaveAttribute("href", "https://github.com/tanishj2006/The-9-Percent-Club/issues/new?template=correction.yml&labels=correction");
    }
    await page.goto("/en/privacy");
    await expect(page.getByTestId("privacy-email")).toHaveText("Email you send is read by the author only. The site itself stores nothing you send.");
  });

  for (const [locale, text] of [
    ["en", "Built by Tanish"],
    ["hi", "तनिश द्वारा बनाया गया"],
  ] as const) {
    test(`${locale}: Built by Tanish has the right href, target and rel`, async ({ page }) => {
      await page.goto(`/${locale}/08`);
      const link = page.getByTestId("built-by");
      await expect(link).toHaveAttribute("href", "https://tanishj-portfolio.vercel.app/?ref=9percentclub");
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener");
      await expect(link.locator(".built-by-text")).toHaveText(text);
      await expect(link.locator(".built-by-arrow")).toHaveText("↗");
      const family = await link.evaluate((el) => getComputedStyle(el).fontFamily);
      expect(family.toLowerCase()).toContain("instrument");
      await expect(page.getByTestId("site-footer")).toContainText("© 2026");
    });
  }

  test("the underline draws in and the arrow nudges, on hover and on focus", async ({ page, isMobile }) => {
    test.skip(isMobile, "hover");
    await page.goto("/en");
    const link = page.getByTestId("built-by");
    const state = () =>
      link.evaluate((el) => ({
        // How much of the underline is drawn, 0..100. Browsers report 0% as 0px.
        underline: parseFloat(getComputedStyle(el.querySelector(".built-by-text")!).backgroundSize),
        arrow: getComputedStyle(el.querySelector(".built-by-arrow")!).transform,
        outline: getComputedStyle(el).outlineStyle,
      }));
    expect((await state()).underline).toBe(0);
    await link.hover();
    await expect.poll(async () => (await state()).underline).toBe(100);
    await expect.poll(async () => (await state()).arrow).not.toBe("none");
    await page.mouse.move(0, 0);
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect.poll(async () => (await state()).outline, "a visible focus ring").toBe("solid");
  });

  test("with reduced motion, nothing animates and the focus ring stays", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/en");
    const link = page.getByTestId("built-by");
    const transitions = await link.evaluate((el) => [
      getComputedStyle(el.querySelector(".built-by-text")!).transitionDuration,
      getComputedStyle(el.querySelector(".built-by-arrow")!).transitionDuration,
    ]);
    expect(transitions).toEqual(["0s", "0s"]);
    await link.focus();
    expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
    await context.close();
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`390px ${scheme}: no horizontal scroll, and links are full touch targets`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ colorScheme: scheme });
      for (const locale of ["en", "hi"]) {
        await page.goto(`/${locale}/methodology`);
        const footer = page.getByTestId("site-footer");
        await footer.scrollIntoViewIfNeeded();
        const sizes = await footer.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth, page: document.documentElement.scrollWidth }));
        expect(sizes.scroll, locale).toBeLessThanOrEqual(sizes.client);
        expect(sizes.page, locale).toBeLessThanOrEqual(390);
        for (const link of await footer.locator("a").all()) {
          expect((await link.boundingBox())!.height, await link.textContent() ?? "").toBeGreaterThanOrEqual(44);
        }
      }
    });
  }

  test("adds no third-party request", async ({ page, baseURL }) => {
    const outside: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith(baseURL!) && !r.url().startsWith("data:")) outside.push(r.url());
    });
    for (const path of ["/en", "/hi/about", "/en/methodology", "/en/privacy"]) await page.goto(path);
    expect(outside).toEqual([]);
  });
});

test.describe("the pages say true things", () => {
  test("privacy lists exactly what a browser ends up holding", async ({ page, context }) => {
    await page.goto("/en/privacy");
    const documented = (await page.getByTestId("stored-name").allTextContents()).sort();
    expect(documented).toEqual(STORED.map((s) => s.name).sort());

    // Use every control that stores something, then look.
    await open(page, "/en/04");
    await page.getByTestId("theme-toggle").click();
    await switchLanguage(page, "hi");
    await page.waitForURL(/\/hi\/04$/);
    const cookies = (await context.cookies()).map((c) => c.name);
    const local = await page.evaluate(() => Object.keys(localStorage));
    const session = await page.evaluate(() => Object.keys(sessionStorage));
    expect([...cookies, ...local].sort()).toEqual(documented);
    expect(session).toEqual([]);
    const locale = (await context.cookies()).find((c) => c.name === "NEXT_LOCALE")!;
    expect(locale.expires, "a session cookie, as the page says").toBe(-1);
  });

  test("reading alone stores nothing, as the page says", async ({ page, context }) => {
    await open(page, "/en/05");
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  });

  test("the methodology footnotes match the chapters word for word", async ({ page }) => {
    for (const locale of ["en", "hi"]) {
      for (const n of ["01", "04", "06", "07", "08"]) {
        await page.goto(`/${locale}/${n}`);
        const chapter = (await page.locator(".outro p.text-sm").textContent())!.trim();
        await page.goto(`/${locale}/methodology`);
        const listed = (await page.getByTestId(`footnote-ch${n}`).locator("dd").textContent())!.trim();
        expect(listed, `${locale} ch${n}`).toBe(chapter);
      }
    }
  });

  test("the methodology SEBI figures are the verified ones", async ({ page }) => {
    await page.goto("/en/methodology");
    const studies = page.locator(".info-studies");
    for (const figure of ["91%", "₹1,05,603 crore", "87.7%", "₹91,685 crore", "90.9%", "₹1,11,788 crore", "93%", "7.2%", "75%"]) {
      await expect(studies).toContainText(figure);
    }
    const links = await studies.locator("a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(links.every((href) => href.startsWith("https://www.sebi.gov.in/sebi_data/attachdocs/"))).toBe(true);
    expect(links).toHaveLength(5);
    await expect(page.getByTestId("contact-email")).toHaveAttribute("href", MAILTO);
  });

  test("terms cover what they must, and name no licence", async ({ page }) => {
    await page.goto("/en/terms");
    for (const section of ["education", "registration", "figures", "risk", "warranty", "links", "copyright", "law"]) {
      await expect(page.getByTestId(`terms-${section}`)).toBeVisible();
    }
    await expect(page.getByTestId("terms-risk")).toContainText("Mutual fund investments are subject to market risks");
    await expect(page.getByTestId("terms-law")).toContainText("laws of India");
    await expect(page.getByTestId("terms")).not.toContainText(/licen[cs]e|MIT|Apache|GPL/i);
  });

  test("about names no credential, employer or city", async ({ page }) => {
    await page.goto("/en/about");
    const text = (await page.getByTestId("about").textContent())!;
    expect(text).toContain("Tanish Jain, a student developer");
    expect(text).not.toMatch(/certified|CFA|NISM|degree|university|works at|engineer at|Mumbai|Delhi|Bengaluru|Bangalore|Pune|Hyderabad|Chennai|Kolkata/i);
    expect(text).not.toMatch(/join the 9%|you can be in the 9%|be one of the 9/i);
  });
});
