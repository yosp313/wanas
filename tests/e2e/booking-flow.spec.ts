import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { expect, request, test, type APIRequestContext, type Page } from "@playwright/test";
import postgres from "postgres";

type Email = { subject: string; to: string[]; text: string };
type MailpitMessage = { ID: string; To: { Address: string }[] };

const local = new Set(["127.0.0.1", "localhost", "[::1]"]);

function localUrl(name: string) {
  const value = process.env[name];
  if (!value || !local.has(new URL(value).hostname)) throw new Error(`${name} must point to a local test service`);
  return value;
}

async function readMessages(mailpit: string) {
  const response = await fetch(mailpit + "/api/v1/messages");
  const result = await response.json() as { messages: MailpitMessage[] };
  return result.messages;
}

async function otp(page: Page, email: string, mailpit: string, locale: "en" | "ar" = "en") {
  const ar = locale === "ar";
  const previous = (await readMessages(mailpit)).map((mail) => mail.ID);
  await page.getByLabel(ar ? "البريد الإلكتروني" : "Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: ar ? "أرسل الرمز" : "Send code" }).click();
  await page.getByRole("button", { name: ar ? "تحقّق من الرمز" : "Verify code" }).waitFor({ timeout: 15_000 });
  let code;
  for (let poll = 0; poll < 30 && !code; poll++) {
    const messages = await readMessages(mailpit);
    const row = messages.find((mail) => !previous.includes(mail.ID) && mail.To.some((item) => item.Address === email));
    if (row) {
      const message = await (await fetch(mailpit + "/api/v1/message/" + row.ID)).json();
      code = (message.Text || message.HTML).match(/\b\d{6}\b/)?.[0];
    }
    if (!code) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(code, "Supabase delivered an OTP to Mailpit");
  await page.getByLabel(ar ? "الرمز" : "Code", { exact: true }).fill(code);
  await page.getByRole("button", { name: ar ? "تحقّق من الرمز" : "Verify code" }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/sign-in"));
}

async function runWorker(http: APIRequestContext, workerSecret: string) {
  const response = await http.post("/api/internal/notifications", {
    headers: { Authorization: `Bearer ${workerSecret}` },
  });
  assert.equal(response.status(), 200, await response.text());
  return response.json();
}

test("delivers a quote and confirms and reschedules the booking through the browser", async ({ browser, baseURL }) => {
  test.skip(process.env.E2E_FULL_FLOW !== "1", "Requires local Supabase Auth, Mailpit and delivery capture");
  test.setTimeout(120_000);
  assert.ok(baseURL && local.has(new URL(baseURL).hostname));
  const origin = baseURL;
  const mailpit = localUrl("MAILPIT_URL");
  const capture = localUrl("NOTIFICATION_TEST_URL");
  const workerSecret = process.env.NOTIFICATION_CRON_SECRET;
  assert.ok(workerSecret);
  const appDb = postgres(localUrl("DATABASE_URL"));
  const authDb = postgres(localUrl("SUPABASE_LOCAL_DATABASE_URL"));
  const http = await request.newContext({ baseURL: origin });
  const testId = randomUUID().slice(0, 8);
  const customerEmail = `customer+${testId}@example.net`;
  const adminEmail = `admin+${testId}@example.net`;
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
    await otp(customer, customerEmail, mailpit);
    await customer.getByRole("heading", { name: "Review your request" }).waitFor();
    assert.equal(await customer.getByLabel("Name", { exact: true }).inputValue(), customerName);
    await customer.getByRole("button", { name: "Submit request" }).click();
    await customer.waitForURL("**/en/requests/*", { timeout: 15_000 });
    await customer.getByRole("heading", { name: customerName }).waitFor();
    const requestId = new URL(customer.url()).pathname.split("/").at(-1);
    assert.ok(requestId);

    const admin = await browser.newPage();
    await admin.goto(origin + "/en/admin/inbox");
    await admin.waitForURL("**/en/sign-in?**");
    await otp(admin, adminEmail, mailpit);
    const [identity] = await authDb`select id from auth.users where email = ${adminEmail}`;
    assert.ok(identity?.id);
    await appDb`insert into admin_access (user_id, is_admin) values (${identity.id}, true)`;
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
    await otp(emailSession, customerEmail, mailpit);
    await emailSession.getByRole("button", { name: "Accept quote" }).click();
    await emailSession.getByRole("heading", { name: "Booking confirmed" }).waitFor();
    await admin.goto(origin + "/en/admin/calendar?month=" + eventDate.slice(0, 7));
    await admin.getByText(eventDate, { exact: false }).first().waitFor();
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
    const [updated] = await appDb`select event_date::text as date, revision from bookings where id = ${booking.id}`;
    assert.equal(updated.date, newDate);
    assert.equal(updated.revision, 2);
    assert.equal((await appDb`select kind from date_reservations where event_date = ${eventDate}`).length, 0);
    const outcomes: Email[] = await (await fetch(capture)).json();
    assert.ok(outcomes.some((message) => message.to.includes(customerEmail) && message.subject === "Your WANAS booking was rescheduled"));

    await appDb`update admin_access set is_admin = false, revoked_at = now() where user_id = ${identity.id}`;
    await admin.goto(origin + "/en/admin/inbox");
    await admin.getByText("This page could not be found.").waitFor();
  } finally {
    await http.dispose();
    await appDb.end();
    await authDb.end();
  }
});

test("submits an Arabic custom-decor request and preserves the draft when switching languages", async ({ page, baseURL }) => {
  test.skip(process.env.E2E_FULL_FLOW !== "1", "Requires local Supabase Auth and Mailpit");
  assert.ok(baseURL && local.has(new URL(baseURL).hostname));
  const mailpit = localUrl("MAILPIT_URL");
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
  await page.getByRole("button", { name: "أقل من ٥٠٬٠٠٠ جنيه", exact: true }).click();
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
  await otp(page, `customer+${id}@example.net`, mailpit, "ar");
  await page.getByRole("button", { name: "إرسال الطلب" }).click();
  await page.waitForURL("**/ar/requests/*");
  await page.getByRole("heading", { name: customerName }).waitFor();
});
