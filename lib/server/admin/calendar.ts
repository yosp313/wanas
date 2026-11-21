import "server-only";

import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { requireDb } from "../db";
import { bookings, eventRequests } from "../db/schema";

export async function getAdminCalendar(start: string, end: string, includePending: boolean) {
  await requireAdmin();
  const db = requireDb();

  const [confirmed, pending] = await Promise.all([
    db.select({
      requestId: bookings.requestId,
      date: bookings.eventDate,
      name: eventRequests.customerName,
      details: eventRequests.details,
    }).from(bookings)
      .innerJoin(eventRequests, eq(bookings.requestId, eventRequests.id))
      .where(and(eq(bookings.status, "confirmed"), gte(bookings.eventDate, start), lt(bookings.eventDate, end))),
    includePending ? db.select({
      requestId: eventRequests.id,
      date: eventRequests.eventDate,
      name: eventRequests.customerName,
      details: eventRequests.details,
    }).from(eventRequests)
      .where(and(inArray(eventRequests.status, ["submitted", "quoted"]), gte(eventRequests.eventDate, start), lt(eventRequests.eventDate, end))) : [],
  ]);

  return { confirmed, pending };
}
