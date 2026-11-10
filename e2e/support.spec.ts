import { expect, test } from "@playwright/test";

test.skip(process.env.E2E_DEV === "1", "production behaviour");

// This build has no NEXT_PUBLIC_UPI_ID or NEXT_PUBLIC_UPI_NAME.
test.describe("without UPI details, support does not exist", () => {
  for (const locale of ["en", "hi"]) {
    test(`/${locale}/support is a 404 and the footer has no link`, async ({ page }) => {
      const response = await page.goto(`/${locale}/support`);
      expect(response?.status()).toBe(404);
      await expect(page.getByTestId("not-found")).toBeVisible();
      await expect(page.getByTestId("support-link")).toHaveCount(0);
      await page.goto(`/${locale}`);
      await expect(page.getByTestId("support-link")).toHaveCount(0);
    });
  }

  test("the sitemap, terms and privacy do not mention it", async ({ page, request }) => {
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/support");
    await page.goto("/en/terms");
    await expect(page.getByTestId("terms-support")).toHaveCount(0);
    await page.goto("/en/privacy");
    await expect(page.getByTestId("privacy-payments")).toHaveCount(0);
  });
});
