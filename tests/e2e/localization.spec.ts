import { expect, test } from "@playwright/test";

test("defaults to Arabic and remembers a route-preserving language switch", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.goto("/ar/plan");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/plan$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});
