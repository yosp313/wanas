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
    await lockDates(tx, [quote.offeredDate]);
    const now = await readDatabaseClock(tx);

    const existing = await tx.select().from(bookings).where(eq(bookings.acceptedQuoteId, quoteId)).for("update");
    if (existing[0]) return existing[0];
    if (request.status !== "quoted" || quote.status !== "current") throw new Error("QUOTE_NOT_ACCEPTABLE");
    if (quote.expiresAt <= now) throw new Error("QUOTE_EXPIRED");

    const reservationRows = await tx.select().from(dateReservations).where(eq(dateReservations.eventDate, quote.offeredDate)).for("update");
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
