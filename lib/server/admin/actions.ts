"use server";
import { and, eq, sql } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { withMutation, lockDates, readDatabaseClock, type Database } from "../db/transactions";
import { dateReservations, eventRequests, quotes } from "../db/schema";
import { hasMinimumNotice } from "../time/cairo";
import { enqueueNotification } from "../notifications/enqueue";
type Locale = "ar" | "en";
export type QuoteInput = { offeredDate: string; services: unknown; totalEgp: number; scopeExplanation?: string | null };
function assertUuid(value: string, name: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`INVALID_${name.toUpperCase()}`); }
function assertDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new Error("INVALID_OFFERED_DATE"); }
function assertQuoteInput(input: QuoteInput) { assertDate(input.offeredDate); if (!Number.isInteger(input.totalEgp) || input.totalEgp < 0 || input.totalEgp > 2_147_483_647) throw new Error("INVALID_TOTAL"); if (typeof input.services !== "string" || input.services.trim().length === 0) throw new Error("INVALID_SERVICES"); if (input.scopeExplanation !== undefined && input.scopeExplanation !== null && typeof input.scopeExplanation !== "string") throw new Error("INVALID_SCOPE_EXPLANATION"); }
function addHours(value: Date, hours: number) { return new Date(value.getTime() + hours * 60 * 60 * 1000); }
async function cairoEventStart(tx: Database, eventDate: string) { const rows = await tx.execute<{ start: Date }>(sql`select (${eventDate}::date::timestamp at time zone 'Africa/Cairo') as start`); return rows[0].start; }
async function lockRequest(tx: Database, requestId: string) { const rows = await tx.select().from(eventRequests).where(eq(eventRequests.id, requestId)).for("update"); if (!rows[0]) throw new Error("REQUEST_NOT_FOUND"); return rows[0]; }
function activeRequestStatus(status: string) { return status === "submitted" || status === "quoted"; }
export async function sendQuote(requestId: string, input: QuoteInput) {
  await requireAdmin(); assertUuid(requestId, "request_id"); assertQuoteInput(input);
  return withMutation(async (tx) => {
    const request = await lockRequest(tx, requestId);
    const current = (await tx.select().from(quotes).where(and(eq(quotes.requestId, requestId), eq(quotes.status, "current"))).for("update"))[0];
    await lockDates(tx, [request.eventDate, input.offeredDate, ...(current ? [current.offeredDate] : [])]);
    const now = await readDatabaseClock(tx);
    if (!activeRequestStatus(request.status)) throw new Error("REQUEST_NOT_ACTIONABLE");
    if (input.offeredDate !== request.eventDate && !hasMinimumNotice(input.offeredDate, now)) throw new Error("OFFERED_DATE_TOO_SOON");
    if (input.offeredDate === request.eventDate && addHours(now, 48) >= await cairoEventStart(tx, request.eventDate) && !hasMinimumNotice(input.offeredDate, now)) throw new Error("ORIGINAL_DATE_HOLD_TOO_LATE");
    const candidate = (await tx.select().from(dateReservations).where(eq(dateReservations.eventDate, input.offeredDate)).for("update"))[0];
    const expired = candidate?.kind === "hold" && !!candidate.holdExpiresAt && candidate.holdExpiresAt <= now;
    const sameHold = !!current && input.offeredDate === current.offeredDate && candidate?.kind === "hold" && candidate.quoteId === current.id;
    if (candidate && !expired && !sameHold) throw new Error("DATE_UNAVAILABLE");
    const expiresAt = addHours(now, 48);
    const quote = (await tx.insert(quotes).values({ requestId, offeredDate: input.offeredDate, services: input.services, totalEgp: input.totalEgp, scopeExplanation: input.scopeExplanation ?? null, status: "current", expiresAt }).returning())[0];
    if (!quote) throw new Error("QUOTE_NOT_CREATED");
    if (current) await tx.update(quotes).set({ status: "superseded", updatedAt: now }).where(eq(quotes.id, current.id));
    await tx.insert(dateReservations).values({ eventDate: input.offeredDate, kind: "hold", quoteId: quote.id, bookingId: null, holdExpiresAt: expiresAt }).onConflictDoUpdate({ target: dateReservations.eventDate, set: { kind: "hold", quoteId: quote.id, bookingId: null, holdExpiresAt: expiresAt, updatedAt: now } });
    if (current && current.offeredDate !== input.offeredDate) await tx.delete(dateReservations).where(and(eq(dateReservations.eventDate, current.offeredDate), eq(dateReservations.quoteId, current.id)));
    await tx.update(eventRequests).set({ status: "quoted", updatedAt: now }).where(eq(eventRequests.id, requestId));
    await enqueueNotification(tx, { type: "quote_ready", payload: { recipient: request.customerEmail, customerName: request.customerName, locale: request.language as Locale, requestId: request.id, quoteId: quote.id, offeredDate: quote.offeredDate, totalEgp: quote.totalEgp, scopeExplanation: quote.scopeExplanation ?? undefined } });
    return quote;
  });
}
export async function declineRequest(requestId: string) {
  await requireAdmin(); assertUuid(requestId, "request_id");
  return withMutation(async (tx) => {
    const request = await lockRequest(tx, requestId);
    const current = (await tx.select().from(quotes).where(and(eq(quotes.requestId, requestId), eq(quotes.status, "current"))).for("update"))[0];
    await lockDates(tx, current ? [current.offeredDate] : []); const now = await readDatabaseClock(tx);
    if (!activeRequestStatus(request.status) || current) throw new Error("REQUEST_NOT_DECLINABLE");
    await tx.update(eventRequests).set({ status: "closed", updatedAt: now }).where(eq(eventRequests.id, requestId));
    await enqueueNotification(tx, { type: "request_declined", payload: { recipient: request.customerEmail, customerName: request.customerName, locale: request.language as Locale, requestId: request.id } });
    return { requestId, status: "closed" as const };
  });
}
