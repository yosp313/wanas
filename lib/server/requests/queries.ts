import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireCustomer } from "../auth/guards";
import { requireDb } from "../db";
import { bookingChangeRequests, bookingRevisions, bookings, dateReservations, eventRequests, quotes } from "../db/schema";

const quoteHold = and(eq(dateReservations.quoteId, quotes.id),
  eq(dateReservations.eventDate, quotes.offeredDate), eq(dateReservations.kind, "hold"));
const liveHold = sql<boolean>`coalesce(${dateReservations.holdExpiresAt} > statement_timestamp()
  and ${quotes.expiresAt} > statement_timestamp(), false)`;

export async function getCustomerRequests() {
  const customer = await requireCustomer();
  return requireDb().select({
    id: eventRequests.id,
    eventDate: eventRequests.eventDate,
    details: eventRequests.details,
    status: eventRequests.status,
    quote: { total: quotes.totalEgp, date: quotes.offeredDate },
    holdUntil: sql<Date | null>`case when ${liveHold}
      then least(${quotes.expiresAt}, ${dateReservations.holdExpiresAt}) end`.mapWith(quotes.expiresAt),
    booking: { id: bookings.id, date: bookings.eventDate, status: bookings.status },
    bookingTerms: bookingRevisions.terms,
  }).from(eventRequests)
    .leftJoin(quotes, and(eq(quotes.requestId, eventRequests.id), eq(quotes.status, "current"), eq(eventRequests.status, "quoted")))
    .leftJoin(dateReservations, quoteHold)
    .leftJoin(bookings, eq(bookings.requestId, eventRequests.id))
    .leftJoin(bookingRevisions, and(eq(bookingRevisions.bookingId, bookings.id), eq(bookingRevisions.revision, bookings.revision)))
    .where(eq(eventRequests.customerId, customer.id))
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
      liveHold,
    }).from(quotes).leftJoin(dateReservations, quoteHold)
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
