import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireCustomer } from "../auth/guards";
import { requireDb } from "../db";
import { bookingChangeRequests, bookingRevisions, bookings, dateReservations, eventRequests, quotes } from "../db/schema";

export async function getCustomerRequests() {
  const customer = await requireCustomer();
  return requireDb().select().from(eventRequests).where(eq(eventRequests.customerId, customer.id))
    .orderBy(desc(eventRequests.createdAt));
}

export async function getCustomerRequest(requestId: string) {
  const customer = await requireCustomer();
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(requestId)) return null;
  const db = requireDb();
  const [request] = await db.select().from(eventRequests)
    .where(and(eq(eventRequests.id, requestId), eq(eventRequests.customerId, customer.id))).limit(1);
  if (!request) return null;

  const [quoteRows, bookingRows] = await Promise.all([
    db.select({
      quote: quotes,
      liveHold: sql<boolean>`coalesce(${dateReservations.holdExpiresAt} > statement_timestamp()
        and ${quotes.expiresAt} > statement_timestamp(), false)`,
    }).from(quotes).leftJoin(dateReservations, and(eq(dateReservations.quoteId, quotes.id),
      eq(dateReservations.eventDate, quotes.offeredDate), eq(dateReservations.kind, "hold")))
      .where(eq(quotes.requestId, requestId)).orderBy(desc(quotes.createdAt)),
    db.select({ booking: bookings, terms: bookingRevisions.terms }).from(bookings)
      .leftJoin(bookingRevisions, and(eq(bookingRevisions.bookingId, bookings.id),
        eq(bookingRevisions.revision, bookings.revision)))
      .where(eq(bookings.requestId, requestId)),
  ]);
  const changes = bookingRows.length ? await db.select().from(bookingChangeRequests)
    .where(inArray(bookingChangeRequests.bookingId, bookingRows.map(({ booking }) => booking.id)))
    .orderBy(desc(bookingChangeRequests.createdAt)) : [];
  return {
    request,
    quotes: quoteRows.map(({ quote, liveHold }) => ({
      ...quote,
      status: quote.status === "current" && !liveHold ? "expired" : quote.status,
    })),
    bookings: bookingRows.map(({ booking, terms }) => ({ ...booking, terms })),
    changes,
  };
}
