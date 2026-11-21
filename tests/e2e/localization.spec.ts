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

test("the homepage seeds a new plan and preserves an existing draft", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Explore ceremony decor" }).click();
  await expect(page).toHaveURL(/#ceremonies$/);
  await page.getByRole("radio", { name: "Anniversary soirée" }).check();
  await page.getByRole("button", { name: "Open the planner" }).click();
  await expect(page).toHaveURL(/\/en\/plan\?eventType=anniversary$/);
  const anniversary = page.getByRole("button", { name: "Anniversary", exact: true });
  await expect(anniversary).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Venue name").fill("Garden room");
  await page.goto("/en");
  await page.getByRole("radio", { name: "Wedding & reception" }).check();
  await page.getByRole("button", { name: "Open the planner" }).click();
  await expect(page).toHaveURL(/\/en\/plan\?eventType=wedding$/);
  await expect(anniversary).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Venue name")).toHaveValue("Garden room");
});
