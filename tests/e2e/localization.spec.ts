import { expect, test } from "@playwright/test";

test("missing pages keep their language and link back home", async ({ page }) => {
  const english = await page.goto("/en/missing-page/example");
  expect(english?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");

  const arabic = await page.goto("/ar/missing-page/example");
  expect(arabic?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
  await expect(page.getByRole("link", { name: "العودة إلى الرئيسية" })).toHaveAttribute("href", "/ar");

  const response = await page.goto("/fr/missing-page/example");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
});

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
  await page.getByRole("link", { name: "See our work" }).click();
  await expect(page).toHaveURL(/#ceremonies$/);
  await page.getByRole("radio", { name: "Anniversary" }).check();
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

test("the planner validates individual fields before continuing", async ({ page }) => {
  await page.goto("/en/plan");
  const guests = page.getByLabel("Estimated guests", { exact: true });
  const venue = page.getByLabel("Venue name", { exact: true });

  await guests.fill("0");
  await venue.fill("   ");
  await venue.press("Tab");
  await expect(guests).toHaveAccessibleDescription("Enter a whole number from 1 to 100,000.");
  await expect(venue).toHaveAccessibleDescription("Complete this field.");
  await expect(page.getByLabel("Street address")).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);

  await guests.fill("50");
  await venue.fill("Garden Room");
  await expect(guests).toHaveAccessibleDescription("");
  await expect(venue).toHaveAccessibleDescription("");

  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const eventType = page.getByRole("group", { name: "Event type" });
  await expect(eventType).toBeFocused();
  await expect(eventType).toHaveAccessibleDescription("Choose an event type.");
});

test("the planner validates mobile numbers before request submission", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("wanas-planner-draft-v1", JSON.stringify({ step: 4, draft: {} }));
  });
  await page.goto("/en/plan");
  const mobile = page.getByLabel("Mobile number", { exact: true });

  await mobile.fill("123");
  await mobile.press("Tab");
  await expect(mobile).toHaveAccessibleDescription("Enter a valid mobile number with at least 7 digits.");

  await mobile.fill("+٢٠ ١٠٠ ١٢٣ ٤٥٦٧");
  await expect(mobile).toHaveAccessibleDescription("");
});
