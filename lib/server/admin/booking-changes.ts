import "server-only";

import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { requireDb } from "../db";
import { bookingChangeRequests, bookings, eventRequests } from "../db/schema";

export async function getPendingBookingChanges() {
  await requireAdmin();
  const db = requireDb();
  return db.select({ change: bookingChangeRequests, booking: bookings, request: eventRequests }).from(bookingChangeRequests).innerJoin(bookings, eq(bookings.id, bookingChangeRequests.bookingId)).innerJoin(eventRequests, eq(eventRequests.id, bookings.requestId)).where(eq(bookingChangeRequests.status, "pending")).orderBy(asc(bookingChangeRequests.createdAt));
}
