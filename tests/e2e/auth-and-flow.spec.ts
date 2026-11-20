import { expect, test } from "@playwright/test";

test("an anonymous visitor is redirected before reading customer requests", async ({ page }) => {
  await page.goto("/en/requests");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  const returnTo = new URL(page.url()).searchParams.get("returnTo");
  expect(returnTo).toBe("/en/requests");
});
