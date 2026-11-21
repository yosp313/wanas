import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { requireDb } from "../db";
import { bookingChangeRequests, bookingRevisions, bookings, eventRequests } from "../db/schema";

export async function getAdminBookingChanges() {
  await requireAdmin();
  const db = requireDb();
  const applied = alias(bookingRevisions, "applied_revision");
  const before = alias(bookingRevisions, "before_revision");
  const seen = alias(bookingRevisions, "seen_revision");
  return db.select({
    change: bookingChangeRequests,
    booking: { revision: bookings.revision, eventDate: bookings.eventDate },
    request: {
      id: eventRequests.id,
      customerName: eventRequests.customerName,
      customerEmail: eventRequests.customerEmail,
      details: eventRequests.details,
    },
    before: { eventDate: before.eventDate, terms: before.terms },
    applied: { eventDate: applied.eventDate, terms: applied.terms },
    seen: { eventDate: seen.eventDate, terms: seen.terms },
  })
    .from(bookingChangeRequests)
    .innerJoin(bookings, eq(bookings.id, bookingChangeRequests.bookingId))
    .innerJoin(eventRequests, eq(eventRequests.id, bookings.requestId))
    // Applying a change writes the same database timestamp and request payload to the new revision.
    .leftJoin(applied, and(
      eq(bookingChangeRequests.status, "applied"),
      eq(applied.bookingId, bookings.id),
      eq(applied.agreedAt, bookingChangeRequests.updatedAt),
      sql`${applied.terms}->'change' = ${bookingChangeRequests.change}`,
    ))
    .leftJoin(before, and(eq(before.bookingId, bookings.id), eq(before.revision, sql`
      case when ${bookingChangeRequests.status} = 'pending' then ${bookings.revision}
           when ${bookingChangeRequests.status} = 'applied' then ${applied.revision} - 1
           else ${bookingChangeRequests.revision} end
    `)))
    .leftJoin(seen, and(eq(seen.bookingId, bookings.id), eq(seen.revision, bookingChangeRequests.revision)))
    .orderBy(desc(bookingChangeRequests.createdAt), desc(bookingChangeRequests.id));
}
