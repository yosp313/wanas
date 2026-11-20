import { expect, test } from "@playwright/test";

test.describe("localized planner entry points", () => {
  test("renders both locale routes and preserves the language link", async ({ page }) => {
    await page.goto("/ar");
    await expect(page).toHaveTitle(/WANAS|واناس/i);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
