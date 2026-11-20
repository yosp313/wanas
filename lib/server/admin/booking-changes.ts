import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { requireDb } from "../db";
import { bookingChangeRequests, bookingRevisions, bookings, eventRequests } from "../db/schema";

export async function getPendingBookingChanges() {
  await requireAdmin();
  const db = requireDb();
  const rows = await db.select({ change: bookingChangeRequests, booking: bookings, request: eventRequests }).from(bookingChangeRequests).innerJoin(bookings, eq(bookings.id, bookingChangeRequests.bookingId)).innerJoin(eventRequests, eq(eventRequests.id, bookings.requestId)).where(eq(bookingChangeRequests.status, "pending")).orderBy(asc(bookingChangeRequests.createdAt));
  return Promise.all(rows.map(async (row) => ({ ...row, priorRevision: (await db.select().from(bookingRevisions).where(eq(bookingRevisions.bookingId, row.booking.id)).orderBy(desc(bookingRevisions.revision)).limit(1))[0] ?? null })));
}
