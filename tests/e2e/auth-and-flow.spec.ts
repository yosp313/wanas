import { expect, test } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { randomUUID } from "node:crypto";

test("an anonymous visitor is redirected before reading customer requests", async ({ page }) => {
  await page.goto("/en/requests");
  await expect(page).toHaveURL(/\/en\/sign-in/);
  const returnTo = new URL(page.url()).searchParams.get("returnTo");
  expect(returnTo).toBe("/en/requests");
});

test("old email links restart localized sign-in with a safe destination", async ({ page }) => {
  await page.goto("/ar/auth/callback?code=stale&returnTo=https://example.com/");
  await expect(page).toHaveURL(/\/ar\/sign-in\?/);
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe("/ar");
  const toast = page.locator('[data-sonner-toast][data-type="error"]');
  await expect(toast).toContainText("انتهت صلاحية الرابط");
  await toast.getByRole("button", { name: "إغلاق الإشعار" }).click();
  await expect(toast).toHaveCount(0);
  await expect(page.getByRole("button", { name: "المتابعة باستخدام Google" })).toBeVisible();
});

test("an expired link offers a new link in the same language", async ({ page }) => {
  await page.goto("/en/sign-in/verify?__clerk_status=expired&returnTo=%2Far%2Fplan%3Freview%3D1");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("This link has expired.");
  await page.getByRole("link", { name: "Request a new link" }).click();
  await expect(page).toHaveURL(/\/en\/sign-in\?/);
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe("/en/plan?review=1");
});

test("sign-in validates email on blur and clears the error when corrected", async ({ page }) => {
  await page.goto("/en/sign-in");
  const email = page.getByLabel("Email", { exact: true });
  await email.fill("invalid");
  await email.press("Tab");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription("Enter a valid email address.");

  await email.fill("guest@example.com");
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription("");
});

test("Clerk accepts a first-time email link request and starts Google OAuth", async ({ page }) => {
  test.skip(process.env.E2E_FULL_FLOW !== "1", "Requires Clerk development keys");
  await setupClerkTestingToken({ page });
  const signIn = "/en/sign-in?returnTo=%2Fen%2Fplan%3Freview%3D1";
  await page.goto(signIn);
  await page.getByLabel("Email", { exact: true }).fill(`new-${randomUUID()}+clerk_test@example.com`);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Open the link in your email");

  await page.goto(signIn);
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL((url) => url.hostname === "accounts.google.com", { waitUntil: "commit" });
});
