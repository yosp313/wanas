import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createClerkClient } from "@clerk/nextjs/server";
import { clerk } from "@clerk/testing/playwright";
import { expect, request, test, type APIRequestContext, type Page } from "@playwright/test";
import postgres from "postgres";

type Email = { subject: string; to: string[]; text: string };

const local = new Set(["127.0.0.1", "localhost", "[::1]"]);

function localUrl(name: string) {
  const value = process.env[name];
  if (!value || !local.has(new URL(value).hostname)) throw new Error(`${name} must point to a local test service`);
  return value;
}

const run = promisify(execFile);

const accounts = test.extend<{ createAccount: (role: string, externalId?: string) => Promise<{ id: string; email: string }> }>({
  createAccount: async ({}, provide) => {
    const { CLERK_SECRET_KEY } = process.env;
    assert.ok(CLERK_SECRET_KEY?.startsWith("sk_test_"), "Use a Clerk development instance");
    const client = createClerkClient({ secretKey: CLERK_SECRET_KEY });
    const created: string[] = [];
    try {
      await provide(async (role, externalId) => {
        const email = `${role}-${randomUUID()}+clerk_test@example.com`;
        const { id } = await client.users.createUser({
          emailAddress: [email],
          externalId,
          skipPasswordRequirement: true,
        });
        created.push(id);
        return { id, email };
      });
    } finally {
      await Promise.all(created.map((id) => client.users.deleteUser(id)));
    }
  },
});

async function signIn(page: Page, emailAddress: string) {
  await clerk.signIn({ page, emailAddress });
  await page.reload();
  await page.waitForURL((url) => !url.pathname.endsWith("/sign-in"));
}

function setAccess(operation: "grant" | "revoke", clerkUserId: string, operatorId: string) {
  return run(process.execPath, ["--import", "tsx", "scripts/set-admin.ts", operation, clerkUserId, operatorId], {
    env: operation === "revoke" ? { ...process.env, CLERK_SECRET_KEY: "" } : process.env,
  });
}

async function runWorker(http: APIRequestContext, workerSecret: string) {
  const response = await http.post("/api/internal/notifications", {
    headers: { Authorization: `Bearer ${workerSecret}` },
  });
  assert.equal(response.status(), 200, await response.text());
  return response.json();
}

test.describe.configure({ timeout: 120_000 });
test.skip(process.env.E2E_FULL_FLOW !== "1", "Requires Clerk development keys and local notification capture");

accounts("delivers a quote and confirms and reschedules the booking through the browser", async ({ browser, baseURL, createAccount }) => {
  test.setTimeout(120_000);
  assert.ok(baseURL && local.has(new URL(baseURL).hostname));
  const origin = baseURL;
  const capture = localUrl("NOTIFICATION_TEST_URL");
  const workerSecret = process.env.NOTIFICATION_CRON_SECRET;
  assert.ok(workerSecret);
  const appDb = postgres(localUrl("DATABASE_URL"));
  const http = await request.newContext({ baseURL: origin });
  const testId = randomUUID().slice(0, 8);
  const importedId = randomUUID();
  const operatorId = randomUUID();
  const [{ id: clerkCustomerId, email: customerEmail }, adminAccount] = await Promise.all([
    createAccount("customer", importedId), createAccount("admin"),
  ]);
  await appDb`insert into clerk_identities (clerk_user_id, app_user_id) values (${clerkCustomerId}, ${importedId})`;
  const customerName = `Cairo event ${testId}`;
  const [{ event_date: eventDate, next_date: newDate }] = await appDb<{ event_date: string; next_date: string }[]>`
    select day::text as event_date, (day + 7)::text as next_date
    from (select current_date + offset_days as day from generate_series(25, 220) as offset_days) available
    where not exists (select 1 from date_reservations where event_date in (available.day, available.day + 7))
    order by random() limit 1
  `;
  try {
    const customer = await browser.newPage();
    await customer.goto(origin + "/ar");
    assert.equal(await customer.locator("html").getAttribute("dir"), "rtl");
    await customer.getByRole("link", { name: "English" }).click();
    await customer.waitForURL("**/en");
    await customer.getByRole("link", { name: "Plan your event" }).click();
    await customer.getByRole("button", { name: "Wedding", exact: true }).click();
    await customer.getByLabel("Estimated guests").fill("50");
    await customer.locator("input[type=date]").fill(eventDate);
    await customer.getByLabel("Venue name").fill("Garden Venue");
    await customer.getByLabel("Street address").fill("1 Cairo Street");
    await customer.getByRole("button", { name: "Garden", exact: true }).click();
    await customer.getByRole("button", { name: "Under EGP 50,000" }).click();
    await customer.getByRole("button", { name: "Continue" }).click();
    await customer.getByRole("button", { name: "Curate it for me" }).click();
    await customer.getByRole("button", { name: "Continue" }).click();
    await customer.getByLabel("Include catering").check();
    await customer.getByRole("button", { name: "Buffet", exact: true }).click();
    await customer.getByRole("button", { name: "Continue" }).click();
    await customer.getByLabel("Name", { exact: true }).fill(customerName);
    await customer.getByLabel("Mobile number").fill("+201000123456");
    await customer.reload();
    await customer.getByRole("heading", { name: "Review your request" }).waitFor();
    assert.equal(await customer.getByLabel("Name", { exact: true }).inputValue(), customerName);
    await customer.getByRole("button", { name: "Submit request" }).click();
    await customer.waitForURL("**/en/sign-in?**");
    const draftKey = "wanas-planner-draft-v1";
    const savedDraft = await customer.evaluate((key) => sessionStorage.getItem(key), draftKey);
    assert.ok(savedDraft);
    await signIn(customer, customerEmail);
    assert.equal(await customer.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!).submissionId, draftKey), JSON.parse(savedDraft).submissionId);
    await customer.getByRole("heading", { name: "Review your request" }).waitFor();
    assert.equal(await customer.getByLabel("Name", { exact: true }).inputValue(), customerName);
    await customer.getByRole("button", { name: "Submit request" }).click();
    await customer.waitForURL("**/en/requests/*", { timeout: 15_000 });
    await customer.getByRole("heading", { name: customerName }).waitFor();
    const requestId = new URL(customer.url()).pathname.split("/").at(-1);
    assert.ok(requestId);
    const [requestRow] = await appDb`select customer_id, customer_email from event_requests where id = ${requestId}`;
    assert.equal(requestRow.customer_id, importedId);
    assert.equal(requestRow.customer_email, customerEmail);
    await customer.evaluate(({ key, value }) => sessionStorage.setItem(key, value), { key: draftKey, value: savedDraft });
    await customer.goto(origin + "/en/plan?review=1");
    await customer.getByRole("button", { name: "Submit request" }).click();
    await customer.waitForURL(origin + "/en/requests/" + requestId);
    const [submissionEmails] = await appDb`select count(*)::int as count from notification_outbox where request_id = ${requestId} and kind = 'request_submitted'`;
    assert.equal(submissionEmails.count, 1);

    const admin = await browser.newPage();
    await admin.goto(origin + "/en/admin/inbox");
    await admin.waitForURL("**/en/sign-in?**");
    await signIn(admin, adminAccount.email);
    await admin.getByText("This page could not be found.").waitFor();
    await setAccess("grant", adminAccount.id, operatorId);
    const [grant] = await appDb`
      select app_user_id, granted_by
      from clerk_identities join admin_access on app_user_id = user_id
      where clerk_user_id = ${adminAccount.id}
    `;
    assert.equal(grant.granted_by, operatorId);
    await admin.goto(origin + "/en/admin/inbox");
    await admin.getByRole("link", { name: customerName }).click();
    await admin.getByLabel("Services").fill("Garden backdrop and table styling");
    await admin.getByLabel("Total EGP").fill("35000");
    await admin.getByLabel("Scope explanation").fill("Seasonal florals included");
    await admin.getByRole("button", { name: "Send quote" }).click();
    await admin.getByRole("listitem").getByText("Garden backdrop and table styling", { exact: true }).waitFor({ timeout: 15_000 });
    const [hold] = await appDb`select kind from date_reservations where event_date = ${eventDate}`;
    assert.equal(hold.kind, "hold");
    const availability = await http.get("/api/availability?month=" + eventDate.slice(0, 7));
    const { dates } = await availability.json() as { dates: { date: string; status: string }[] };
    assert.deepEqual(dates.find(({ date }) => date === eventDate), { date: eventDate, status: "held" });
    await customer.goto(origin + "/en/admin/inbox");
    await customer.getByText("This page could not be found.").waitFor();

    assert.equal((await http.post("/api/internal/notifications")).status(), 401);
    await Promise.all([runWorker(http, workerSecret), runWorker(http, workerSecret)]);
    const emails: Email[] = await (await fetch(capture)).json();
    const quoteMessages = emails.filter((message) => message.to.includes(customerEmail) && message.subject === "Your WANAS quote is ready");
    assert.equal(quoteMessages.length, 1);
    const quoteUrl = quoteMessages[0].text.match(/https?:\/\/\S+/)?.[0];
    assert.ok(quoteUrl);
    assert.equal(quoteUrl, origin + "/en/requests/" + requestId);

    const emailSession = await browser.newPage();
    await emailSession.goto(quoteUrl);
    await emailSession.waitForURL("**/en/sign-in?**");
    await signIn(emailSession, customerEmail);
    await emailSession.getByRole("button", { name: "Accept quote" }).click();
    await emailSession.getByRole("heading", { name: "Booking confirmed" }).waitFor();
    await admin.goto(origin + "/en/admin/calendar?month=" + eventDate.slice(0, 7));
    const grid = admin.getByRole("group");
    await expect(grid.getByRole("link", { name: `${customerName} · Confirmed bookings · ${eventDate}` })).toBeVisible();
    await admin.getByRole("link", { name: "Pending requests", exact: true }).click();
    await expect(grid.getByRole("link", { name: new RegExp(customerName) })).toHaveCount(0);
    await admin.getByRole("link", { name: "Confirmed bookings", exact: true }).click();
    await admin.getByRole("link", { name: "Agenda", exact: true }).click();
    await admin.getByRole("link", { name: "Hide summary" }).click();
    await expect(admin.locator("main aside")).toHaveCount(0);
    await expect(admin.getByRole("link", { name: new RegExp(customerName) })).toContainText(eventDate);
    const [booking] = await appDb`select id, status, revision from bookings where request_id = ${requestId}`;
    assert.equal(booking.status, "confirmed");
    assert.equal(booking.revision, 1);
    assert.equal((await appDb`select kind from date_reservations where event_date = ${eventDate}`)[0].kind, "booking");

    await emailSession.getByLabel("New date").fill(newDate);
    await emailSession.getByRole("button", { name: "Request change", exact: true }).click();
    await emailSession.getByText("Pending " + newDate, { exact: false }).waitFor();
    await admin.goto(origin + "/en/admin/changes");
    await admin.getByRole("button", { name: "Apply agreement", exact: true }).click();
    await admin.getByText("No pending changes.").waitFor();
    await runWorker(http, workerSecret);
    const [updated] = await appDb`select b.event_date::text as date, b.revision, r.agreed_by from bookings b join booking_revisions r on r.booking_id = b.id and r.revision = b.revision where b.id = ${booking.id}`;
    assert.equal(updated.agreed_by, grant.app_user_id);
    assert.equal(updated.date, newDate);
    assert.equal(updated.revision, 2);
    assert.equal((await appDb`select kind from date_reservations where event_date = ${eventDate}`).length, 0);
    const outcomes: Email[] = await (await fetch(capture)).json();
    assert.ok(outcomes.some((message) => message.to.includes(customerEmail) && message.subject === "Your WANAS booking was rescheduled"));

    await admin.goto(quoteUrl);
    await admin.getByText("This page could not be found.").waitFor();
    await setAccess("revoke", adminAccount.id, operatorId);
    await admin.goto(origin + "/en/admin/inbox");
    await admin.getByText("This page could not be found.").waitFor();
    await setAccess("grant", adminAccount.id, operatorId);
    await admin.goto(origin + "/en/admin/requests/" + requestId);
    await admin.getByRole("heading", { name: customerName }).waitFor();
  } finally {
    await http.dispose();
    await appDb.end();
  }
});

accounts("submits an Arabic custom-decor request and preserves the draft when switching languages", async ({ page, baseURL, createAccount }) => {
  assert.ok(baseURL && local.has(new URL(baseURL).hostname));
  const id = randomUUID().slice(0, 8);
  const customerName = `مناسبة ${id}`;
  const eventDate = new Date(Date.now() + 244 * 86400000).toISOString().slice(0, 10);

  await page.goto("/ar/plan");
  assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
  await page.getByRole("button", { name: "خطوبة", exact: true }).click();
  await page.getByLabel("عدد الضيوف المتوقع").fill("75");
  await page.locator("input[type=date]").fill(eventDate);
  await page.getByLabel("اسم المكان").fill("قاعة الاختبار");
  await page.getByLabel("العنوان بالتفصيل").fill("شارع النيل");
  await page.getByRole("button", { name: "قاعة", exact: true }).click();
  await page.getByRole("button", { name: "أقل من 50,000 جنيه", exact: true }).click();
  await page.getByRole("link", { name: "English" }).click();
  await page.waitForURL("**/en/plan");
  await expect(page.getByLabel("Venue name")).toHaveValue("قاعة الاختبار");
  await page.getByRole("link", { name: "العربية" }).click();
  await page.waitForURL("**/ar/plan");

  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("button", { name: "أصمّم الديكور بنفسي" }).click();
  await page.getByRole("button", { name: "تيراكوتا دافئة" }).click();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByLabel("الاسم", { exact: true }).fill(customerName);
  await page.getByLabel("رقم الهاتف").fill("+٢٠١٠٠٠٠٠٠٠٠");
  await page.getByRole("button", { name: "إرسال الطلب" }).click();
  await page.waitForURL("**/ar/sign-in?**");
  const customerAccount = await createAccount("customer-ar");
  await signIn(page, customerAccount.email);
  await page.getByRole("button", { name: "إرسال الطلب" }).click();
  await page.waitForURL("**/ar/requests/*");
  await page.getByRole("heading", { name: customerName }).waitFor();
});
