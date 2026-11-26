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
  const occasion = page.getByLabel("Your occasion");
  await page.getByRole("button", { name: "Open the planner" }).click();
  await expect(occasion).toBeFocused();
  await page.getByRole("link", { name: "Occasions", exact: true }).click();
  await expect(page).toHaveURL(/#ceremonies$/);
  await page.getByLabel("Your occasion").selectOption("anniversary");
  await page.getByRole("button", { name: "Open the planner" }).click();
  await expect(page).toHaveURL(/\/en\/plan\?eventType=anniversary$/);
  const anniversary = page.getByRole("button", { name: "Anniversary", exact: true });
  await expect(anniversary).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Venue name").fill("Garden room");
  await page.goto("/en");
  await page.getByLabel("Your occasion").selectOption("wedding");
  await page.getByRole("button", { name: "Open the planner" }).click();
  await expect(page).toHaveURL(/\/en\/plan\?eventType=wedding$/);
  await expect(anniversary).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Venue name")).toHaveValue("Garden room");
});

test("the landing slideshows rotate, pause, and support direct selection", async ({ page }) => {
  await page.clock.install();
  await page.goto("/en");
  const hero = page.getByRole("figure", { name: "Event settings" });
  const reception = hero.getByRole("button", { name: "A courtyard reception" });
  const ceremony = hero.getByRole("button", { name: "The ceremony setting" });
  await expect(hero.getByRole("button", { name: "Pause slideshow" })).toBeVisible();
  await expect(reception).toHaveAttribute("aria-current", "true");
  await page.clock.runFor(6000);
  await expect(ceremony).toHaveAttribute("aria-current", "true");

  await hero.getByRole("button", { name: "Pause slideshow" }).click();
  await page.mouse.move(0, 0);
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.clock.runFor(6000);
  await expect(ceremony).toHaveAttribute("aria-current", "true");
  await expect(hero.getByRole("button", { name: "Play slideshow" })).toBeVisible();
  await reception.click();
  await expect(reception).toHaveAttribute("aria-current", "true");

  const venues = page.getByRole("figure", { name: "Venue ideas" });
  await venues.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(venues.getByRole("button", { name: "Historic courtyard" })).toHaveAttribute("aria-current", "true");
  await page.clock.runFor(6000);
  await expect(venues.getByRole("button", { name: "Botanical glasshouse" })).toHaveAttribute("aria-current", "true");
  const ballroom = venues.getByRole("button", { name: "Hotel ballroom" });
  await ballroom.press("Enter");
  await expect(ballroom).toHaveAttribute("aria-current", "true");
  await expect(venues.getByText("Ceiling installations, layered drapery, and a custom stage.")).toBeVisible();
  await venues.getByRole("button", { name: "Next venue" }).click();
  await expect(venues.getByRole("button", { name: "Historic courtyard" })).toHaveAttribute("aria-current", "true");
});

test("the sticky navbar clears section links on a narrow Arabic landing page", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/ar");
  const navbar = page.getByRole("banner");
  await expect(page.getByRole("navigation", { name: "في هذه الصفحة" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "إيقاف عرض الصور مؤقتًا" })).toBeHidden();
  await page.clock.runFor(6000);
  await expect(page.getByRole("button", { name: "استقبال في الفناء" })).toHaveAttribute("aria-current", "true");
  expect((await navbar.boundingBox())?.height).toBeLessThan(120);
  await navbar.getByRole("link", { name: "المناسبات", exact: true }).click();
  await expect(page).toHaveURL(/#ceremonies$/);
  const anchors = () => page.evaluate(() => ({
    scroll: window.scrollY,
    header: document.querySelector("header")!.getBoundingClientRect().top,
    clearance: document.getElementById("ceremonies")!.getBoundingClientRect().top
      - document.querySelector("header")!.getBoundingClientRect().bottom,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  await expect.poll(async () => (await anchors()).scroll).toBeGreaterThan(100);
  const { header, clearance, overflow } = await anchors();
  expect(header).toBe(0);
  expect(clearance).toBeGreaterThanOrEqual(0);
  expect(overflow).toBe(0);
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

test("custom decor keeps the moodboard, edited colors, and elements through reload and review", async ({ page }) => {
  await page.addInitScript(() => {
    const key = "wanas-planner-draft-v1";
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify({ step: 2, draft: {} }));
  });
  await page.goto("/en/plan");
  await page.getByRole("button", { name: "Customize my decor" }).click();
  const board = page.getByRole("button", { name: "Emerald and gold", exact: true });
  await board.click();
  await expect(board).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Terracotta & olive" }).click();
  await page.getByRole("button", { name: /Secondary/ }).click();
  const shade = page.getByLabel("Fine-tune shade");
  await expect(shade).toHaveValue("#7a6e4f");
  const wheel = page.locator('[class*="colorWheel"]');
  await wheel.click({ position: { x: 56, y: 6 } });
  await expect(shade).toHaveValue("#ff0000");
  await shade.fill("#447799");

  const lighting = page.getByRole("checkbox", { name: "Lighting", exact: true });
  await lighting.check();
  await page.reload();
  await expect(board).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Secondary #447799/ })).toBeVisible();
  await expect(lighting).toBeChecked();

  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Emerald and gold, Terracotta & olive", { exact: true })).toBeVisible();
  await expect(page.getByText("#c2652a · #447799 · #e8dfd3", { exact: true })).toBeVisible();
  await expect(page.getByText("Lighting", { exact: true })).toBeVisible();
});
