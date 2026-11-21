import "server-only";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { requireDb } from "../db";
import { bookings, dateReservations, eventRequests, notificationOutbox, quotes } from "../db/schema";
import { CAIRO_TIME_ZONE } from "../time/cairo";

export async function getAdminInbox(includeArchived: boolean) {
  await requireAdmin();
  const db = requireDb();
  const [entries, failures, [confirmed]] = await Promise.all([
    db.select({ request: eventRequests, conflict: dateReservations.eventDate })
      .from(eventRequests)
      .leftJoin(dateReservations, and(eq(dateReservations.eventDate, eventRequests.eventDate),
        eq(dateReservations.kind, "booking")))
      .where(inArray(eventRequests.status, includeArchived
        ? ["submitted", "quoted", "booked", "closed", "withdrawn"]
        : ["submitted", "quoted"]))
      .orderBy(desc(eventRequests.createdAt)),
    db.select({
      id: notificationOutbox.id,
      requestId: notificationOutbox.requestId,
      kind: notificationOutbox.kind,
      providerError: notificationOutbox.providerError,
      updatedAt: notificationOutbox.updatedAt,
    }).from(notificationOutbox).where(eq(notificationOutbox.status, "failed"))
      .orderBy(desc(notificationOutbox.updatedAt)).limit(50),
    db.select({ count: count() }).from(bookings).where(and(
      eq(bookings.status, "confirmed"),
      sql`date_trunc('month', ${bookings.eventDate}::timestamp) = date_trunc('month', now() at time zone ${CAIRO_TIME_ZONE})`,
    )),
  ]);
  return {
    requests: entries.map(({ request, conflict }) => ({
      ...request,
      dateUnavailable: Boolean(conflict) && (request.status === "submitted" || request.status === "quoted"),
    })),
    failures,
    confirmed: confirmed.count,
  };
}

export async function getAdminRequest(requestId: string) {
  await requireAdmin();
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(requestId)) return null;
  const db = requireDb();
  const [request] = await db.select().from(eventRequests).where(eq(eventRequests.id, requestId)).limit(1);
  if (!request) return null;
  const requestQuotes = await db.select().from(quotes).where(eq(quotes.requestId, requestId))
    .orderBy(desc(quotes.createdAt));
  return { request, quotes: requestQuotes };
}
