import { expect, test } from "@playwright/test";

const mailpitUrl = process.env.MAILPIT_URL;
const testEmail = process.env.E2E_TEST_EMAIL;

async function readLatestCode() {
  if (!mailpitUrl || !testEmail) throw new Error("MAILPIT_URL and E2E_TEST_EMAIL are required");
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${mailpitUrl}/api/v1/search?query=to:${encodeURIComponent(testEmail)}&limit=10`);
    if (response.ok) {
      const result = await response.json() as { messages?: Array<{ ID: string }> };
      const message = result.messages?.[0];
      if (message) {
        const body = await (await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`)).json() as { Text?: string; HTML?: string };
        const match = `${body.Text ?? ""}\n${body.HTML ?? ""}`.match(/(?:code|كود)[^0-9]*(\d{6})/i);
        if (match) return match[1];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the Supabase Auth email in Mailpit");
}

test("an anonymous visitor is redirected before reading customer requests", async ({ page }) => {
  await page.goto("/en/requests");
  await expect(page).toHaveURL(/\/en\/sign-in/);
});

test.describe("local Supabase Auth and full flow", () => {
  test.skip(!process.env.E2E_FULL_FLOW || !mailpitUrl || !testEmail, "Set E2E_FULL_FLOW, MAILPIT_URL, and E2E_TEST_EMAIL for service-backed E2E tests");

  test("signs in with the email code and returns to the planner", async ({ page }) => {
    await page.goto("/en/sign-in?returnTo=%2Fen%2Fplan%3Freview%3D1");
    await page.getByLabel("Email").fill(testEmail!);
    await page.getByRole("button", { name: "Send code" }).click();
    await page.getByLabel("Code").fill(await readLatestCode());
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page).toHaveURL(/\/en\/plan\?review=1/);
  });
});
