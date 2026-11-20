"use server";

import { and, eq } from "drizzle-orm";
import { requireCustomer } from "../auth/guards";
import { withMutation, lockDates, readDatabaseClock, type Database } from "../db/transactions";
import { bookings, bookingRevisions, dateReservations, eventRequests, quotes } from "../db/schema";
import { enqueueNotification } from "../notifications/enqueue";

function assertUuid(value: string, name: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`INVALID_${name.toUpperCase()}`);
}

async function ownedRequest(tx: Database, requestId: string, customerId: string) {
  const rows = await tx.select().from(eventRequests).where(and(eq(eventRequests.id, requestId), eq(eventRequests.customerId, customerId))).for("update");
  if (!rows[0]) throw new Error("REQUEST_NOT_FOUND");
  return rows[0];
}

export async function acceptQuote(requestId: string, quoteId: string) {
  const customer = await requireCustomer();
  assertUuid(requestId, "request_id");
  assertUuid(quoteId, "quote_id");

  return withMutation(async (tx) => {
    const request = await ownedRequest(tx, requestId, customer.id);
    const quoteRows = await tx.select().from(quotes).where(and(eq(quotes.id, quoteId), eq(quotes.requestId, requestId))).for("update");
    const quote = quoteRows[0];
    if (!quote) throw new Error("QUOTE_NOT_FOUND");

    // Lock every date only after request and quote locks. This order is shared by
    // admin quote writes and prevents cross-date deadlocks.
    const [existing] = await tx.select().from(bookings).where(eq(bookings.acceptedQuoteId, quoteId));
    if (existing) return existing;
    await lockDates(tx, [quote.offeredDate]);
    if (request.status !== "quoted" || quote.status !== "current") throw new Error("QUOTE_NOT_ACCEPTABLE");
    const reservationRows = await tx.select().from(dateReservations).where(eq(dateReservations.eventDate, quote.offeredDate)).for("update");
    const now = await readDatabaseClock(tx);
    if (quote.expiresAt <= now) throw new Error("QUOTE_EXPIRED");
    const reservation = reservationRows[0];
    if (!reservation || reservation.kind !== "hold" || reservation.quoteId !== quote.id || !reservation.holdExpiresAt || reservation.holdExpiresAt <= now) throw new Error("QUOTE_HOLD_EXPIRED");

    const inserted = await tx.insert(bookings).values({ requestId, acceptedQuoteId: quote.id, eventDate: quote.offeredDate, revision: 1, status: "confirmed" }).returning();
    const booking = inserted[0];
    if (!booking) throw new Error("BOOKING_NOT_CREATED");
    await tx.insert(bookingRevisions).values({ bookingId: booking.id, revision: 1, eventDate: quote.offeredDate, terms: { services: quote.services, totalEgp: quote.totalEgp, scopeExplanation: quote.scopeExplanation }, agreedBy: customer.id, agreedAt: now });
    await tx.update(dateReservations).set({ kind: "booking", quoteId: null, bookingId: booking.id, holdExpiresAt: null, updatedAt: now }).where(eq(dateReservations.eventDate, quote.offeredDate));
    await tx.update(quotes).set({ status: "accepted", updatedAt: now }).where(eq(quotes.id, quote.id));
    await tx.update(eventRequests).set({ status: "booked", updatedAt: now }).where(eq(eventRequests.id, request.id));
    await enqueueNotification(tx, { type: "booking_confirmed", payload: { requestId: request.id, quoteId: quote.id, bookingId: booking.id, recipient: request.customerEmail, customerName: request.customerName, locale: request.language as "ar" | "en", offeredDate: quote.offeredDate, totalEgp: quote.totalEgp } });
    return booking;
  });
}

export async function declineQuote(requestId: string, quoteId: string) {
  const customer = await requireCustomer();
  assertUuid(requestId, "request_id");
  assertUuid(quoteId, "quote_id");
  return withMutation(async (tx) => {
    const request = await ownedRequest(tx, requestId, customer.id);
    const quote = (await tx.select().from(quotes).where(and(eq(quotes.id, quoteId), eq(quotes.requestId, requestId))).for("update"))[0];
    if (!quote) throw new Error("QUOTE_NOT_FOUND");
    await lockDates(tx, [quote.offeredDate]);
    const now = await readDatabaseClock(tx);
    if (request.status !== "quoted" || quote.status !== "current") throw new Error("QUOTE_NOT_DECLINABLE");
    const reservation = (await tx.select().from(dateReservations).where(eq(dateReservations.eventDate, quote.offeredDate)).for("update"))[0];
    if (!reservation || reservation.kind !== "hold" || reservation.quoteId !== quote.id || !reservation.holdExpiresAt || reservation.holdExpiresAt <= now || quote.expiresAt <= now) throw new Error("QUOTE_EXPIRED");
    await tx.update(quotes).set({ status: "declined", updatedAt: now }).where(eq(quotes.id, quote.id));
    await tx.delete(dateReservations).where(and(eq(dateReservations.eventDate, quote.offeredDate), eq(dateReservations.quoteId, quote.id)));
    await tx.update(eventRequests).set({ status: "submitted", updatedAt: now }).where(eq(eventRequests.id, requestId));
    return { requestId, quoteId, status: "declined" as const };
  });
}

export async function withdrawRequest(requestId: string) {
  const customer = await requireCustomer();
  assertUuid(requestId, "request_id");
  return withMutation(async (tx) => {
    const request = await ownedRequest(tx, requestId, customer.id);
    const current = (await tx.select().from(quotes).where(and(eq(quotes.requestId, requestId), eq(quotes.status, "current"))).for("update"))[0];
    await lockDates(tx, current ? [current.offeredDate] : []);
    const now = await readDatabaseClock(tx);
    if (request.status === "booked") throw new Error("REQUEST_ALREADY_BOOKED");
    if (request.status !== "submitted" && request.status !== "quoted") throw new Error("REQUEST_NOT_WITHDRAWABLE");
    if (current) {
      await tx.update(quotes).set({ status: "withdrawn", updatedAt: now }).where(eq(quotes.id, current.id));
      await tx.delete(dateReservations).where(and(eq(dateReservations.eventDate, current.offeredDate), eq(dateReservations.quoteId, current.id)));
    }
    await tx.update(eventRequests).set({ status: "withdrawn", updatedAt: now }).where(eq(eventRequests.id, requestId));
    return { requestId, status: "withdrawn" as const };
  });
}
