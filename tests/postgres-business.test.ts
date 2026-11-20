import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, describe, it } from "node:test";
import postgres, { type Sql, type TransactionSql } from "postgres";

const databaseUrl = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for PostgreSQL integration tests");
const parsedUrl = new URL(databaseUrl);
if (!new Set(["127.0.0.1", "localhost", "::1"]).has(parsedUrl.hostname)) throw new Error("Integration tests only allow a local PostgreSQL host");

const sql = postgres(databaseUrl, { max: 12, idle_timeout: 2 });
const activeRuns = new Set<string>();
const isoDate = (daysFromNow: number) => {
  const date = new Date(Date.now() + daysFromNow * 86_400_000);
  return date.toISOString().slice(0, 10);
};
const testRun = () => { const runId = randomUUID(); activeRuns.add(runId); return runId; };
const customer = () => randomUUID();

async function insertRequest(db: Sql, runId: string, eventDate: string, customerId = customer()) {
  const submissionId = randomUUID();
  const [request] = await db`
    insert into event_requests (customer_id, submission_id, language, customer_email, customer_name, customer_mobile, event_date, details)
    values (${customerId}, ${submissionId}, 'en', ${`test+${runId}@example.invalid`}, 'Integration test', '+201000000000', ${eventDate}, ${db.json({ testRun: runId })}::jsonb)
    returning id, customer_id as "customerId", submission_id as "submissionId"
  `;
  return request as { id: string; customerId: string; submissionId: string };
}

async function cleanup(db: Sql, runId: string) {
  await db.begin(async (tx) => {
    const requests = await tx`select id from event_requests where details->>'testRun' = ${runId}`;
    const requestIds = requests.map((row) => row.id as string);
    if (requestIds.length === 0) return;
    const quotes = await tx`select id, offered_date as "offeredDate" from quotes where request_id = any(${requestIds}::uuid[])`;
    const quoteIds = quotes.map((row) => row.id as string);
    const bookings = await tx`select id from bookings where request_id = any(${requestIds}::uuid[])`;
    const bookingIds = bookings.map((row) => row.id as string);
    if (bookingIds.length) {
      await tx`delete from booking_change_requests where booking_id = any(${bookingIds}::uuid[])`;
      await tx`delete from booking_revisions where booking_id = any(${bookingIds}::uuid[])`;
    }
    await tx`delete from notification_outbox where request_id = any(${requestIds}::uuid[])`;
    await tx`delete from date_reservations where booking_id = any(${bookingIds.length ? bookingIds : ["00000000-0000-0000-0000-000000000000"]}::uuid[])`;
    if (bookingIds.length) await tx`delete from bookings where id = any(${bookingIds}::uuid[])`;
    if (quoteIds.length) await tx`delete from date_reservations where quote_id = any(${quoteIds}::uuid[])`;
    if (quoteIds.length) await tx`delete from quotes where id = any(${quoteIds}::uuid[])`;
    await tx`delete from event_requests where id = any(${requestIds}::uuid[])`;
  });
}

async function claimDate(tx: TransactionSql, eventDate: string) {
  await tx`select pg_advisory_xact_lock(hashtextextended(${eventDate}, 0))`;
  const [existing] = await tx`select kind, quote_id as "quoteId", hold_expires_at as "holdExpiresAt" from date_reservations where event_date = ${eventDate} for update`;
  if (existing && (existing.kind === "booking" || (existing.holdExpiresAt && new Date(existing.holdExpiresAt) > new Date()))) return false;
  if (existing) await tx`delete from date_reservations where event_date = ${eventDate}`;
  return true;
}

describe("PostgreSQL business invariants", () => {
  afterEach(async () => {
    for (const runId of activeRuns) {
      await cleanup(sql, runId);
      activeRuns.delete(runId);
    }
  });
  after(async () => { await sql.end({ timeout: 2 }); });

  it("deduplicates concurrent submissions by customer and submission ID", async () => {
    const runId = testRun();
    const eventDate = isoDate(20);
    const customerId = customer();
    const submissionId = randomUUID();
    const insert = async () => sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtextextended(${`${customerId}:${submissionId}`}, 0))`;
      await new Promise((resolve) => setTimeout(resolve, 30));
      const [existing] = await tx`select id from event_requests where customer_id = ${customerId} and submission_id = ${submissionId} limit 1`;
      if (existing) return existing.id as string;
      const [row] = await tx`
        insert into event_requests (customer_id, submission_id, language, customer_email, customer_name, customer_mobile, event_date, details)
        values (${customerId}, ${submissionId}, 'en', ${`test+${runId}@example.invalid`}, 'Concurrent submission', '+201000000001', ${eventDate}, ${tx.json({ testRun: runId })}::jsonb)
        returning id
      `;
      return row.id as string;
    });
    const [first, second] = await Promise.all([insert(), insert()]);
    assert.equal(first, second);
    const rows = await sql`select count(*)::int as count from event_requests where customer_id = ${customerId} and submission_id = ${submissionId}`;
    assert.equal(rows[0].count, 1);
    await cleanup(sql, runId);
  });

  it("allows one active hold when two quote transactions target one date", async () => {
    const runId = testRun();
    const eventDate = isoDate(20);
    const requestA = await insertRequest(sql, runId, eventDate);
    const requestB = await insertRequest(sql, runId, eventDate);
    const quoteA = randomUUID();
    const quoteB = randomUUID();
    const offer = async (requestId: string, quoteId: string) => sql.begin(async (tx) => {
      const won = await claimDate(tx, eventDate);
      if (!won) return false;
      await tx`insert into quotes (id, request_id, offered_date, services, total_egp, expires_at) values (${quoteId}, ${requestId}, ${eventDate}, ${JSON.stringify("test")}, 1000, now() + interval '48 hours')`;
      await tx`insert into date_reservations (event_date, kind, quote_id, hold_expires_at) values (${eventDate}, 'hold', ${quoteId}, now() + interval '48 hours')`;
      return true;
    });
    const [a, b] = await Promise.all([offer(requestA.id, quoteA), offer(requestB.id, quoteB)]);
    assert.notEqual(a, b);
    const reservations = await sql`select quote_id as "quoteId" from date_reservations where event_date = ${eventDate}`;
    assert.equal(reservations.length, 1);
    assert.equal(reservations[0].quoteId, a ? quoteA : quoteB);
    await cleanup(sql, runId);
  });

  it("rejects acceptance after expiry and accepts only the current replacement quote", async () => {
    const runId = testRun();
    const eventDate = isoDate(20);
    const request = await insertRequest(sql, runId, eventDate);
    const oldQuote = randomUUID();
    await sql`insert into quotes (id, request_id, offered_date, services, total_egp, expires_at, status) values (${oldQuote}, ${request.id}, ${eventDate}, ${JSON.stringify("old")}, 1000, now() - interval '1 second', 'superseded')`;
    const currentQuote = randomUUID();
    await sql`insert into quotes (id, request_id, offered_date, services, total_egp, expires_at, status) values (${currentQuote}, ${request.id}, ${eventDate}, ${JSON.stringify("current")}, 1200, now() + interval '48 hours', 'current')`;
    await sql`insert into date_reservations (event_date, kind, quote_id, hold_expires_at) values (${eventDate}, 'hold', ${currentQuote}, now() + interval '48 hours')`;
    const oldAcceptance = await sql`select 1 from quotes q join date_reservations r on r.quote_id = q.id where q.id = ${oldQuote} and q.status = 'current' and q.expires_at > now() and r.kind = 'hold'`;
    assert.equal(oldAcceptance.length, 0);
    const currentAcceptance = await sql`select 1 from quotes q join date_reservations r on r.quote_id = q.id where q.id = ${currentQuote} and q.status = 'current' and q.expires_at > now() and r.kind = 'hold' and r.hold_expires_at > now()`;
    assert.equal(currentAcceptance.length, 1);
    await cleanup(sql, runId);
  });

  it("serializes competing reschedules to one destination date", async () => {
    const runId = testRun();
    const destination = isoDate(30);
    const originalA = isoDate(21);
    const originalB = isoDate(22);
    const requestA = await insertRequest(sql, runId, originalA);
    const requestB = await insertRequest(sql, runId, originalB);
    const quoteA = randomUUID();
    const quoteB = randomUUID();
    await sql`insert into quotes (id, request_id, offered_date, services, total_egp, expires_at, status) values (${quoteA}, ${requestA.id}, ${originalA}, ${JSON.stringify("a")}, 1000, now() + interval '48 hours', 'accepted'), (${quoteB}, ${requestB.id}, ${originalB}, ${JSON.stringify("b")}, 1000, now() + interval '48 hours', 'accepted')`;
    const bookingA = randomUUID();
    const bookingB = randomUUID();
    await sql`insert into bookings (id, request_id, accepted_quote_id, event_date) values (${bookingA}, ${requestA.id}, ${quoteA}, ${originalA}), (${bookingB}, ${requestB.id}, ${quoteB}, ${originalB})`;
    await sql`insert into date_reservations (event_date, kind, booking_id) values (${originalA}, 'booking', ${bookingA}), (${originalB}, 'booking', ${bookingB})`;
    const move = async (bookingId: string, original: string) => sql.begin(async (tx) => {
      const dates = [original, destination].sort();
      for (const date of dates) await tx`select pg_advisory_xact_lock(hashtextextended(${date}, 0))`;
      const [target] = await tx`select event_date from date_reservations where event_date = ${destination} for update`;
      if (target) return false;
      await tx`insert into date_reservations (event_date, kind, booking_id) values (${destination}, 'booking', ${bookingId})`;
      await tx`delete from date_reservations where event_date = ${original} and booking_id = ${bookingId}`;
      await tx`update bookings set event_date = ${destination}, revision = revision + 1 where id = ${bookingId}`;
      return true;
    });
    const [a, b] = await Promise.all([move(bookingA, originalA), move(bookingB, originalB)]);
    assert.notEqual(a, b);
    const destinationRows = await sql`select booking_id as "bookingId" from date_reservations where event_date = ${destination}`;
    assert.equal(destinationRows.length, 1);
    assert.equal(destinationRows[0].bookingId, a ? bookingA : bookingB);
    await cleanup(sql, runId);
  });

  it("uses Cairo calendar dates for the ten-day notice boundary", async () => {
    const { hasMinimumNotice } = await import("../lib/server/time/cairo");
    const beforeMidnight = new Date("2026-01-01T21:59:59.000Z");
    const afterMidnight = new Date("2026-01-01T22:00:00.000Z");
    assert.equal(hasMinimumNotice("2026-01-11", beforeMidnight), true);
    assert.equal(hasMinimumNotice("2026-01-11", afterMidnight), false);
  });
});
