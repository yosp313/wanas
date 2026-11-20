import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { requireCustomer } from "../auth/guards";
import { requireDb } from "../db";
import { bookingChangeRequests, bookings, eventRequests, quotes } from "../db/schema";

export async function getCustomerRequests() {
  const customer = await requireCustomer();
  const db = requireDb();
  return db.select().from(eventRequests).where(eq(eventRequests.customerId, customer.id)).orderBy(desc(eventRequests.createdAt));
}

export async function getCustomerRequest(requestId: string) {
  const customer = await requireCustomer();
  const db = requireDb();
  const request = (await db.select().from(eventRequests).where(and(eq(eventRequests.id, requestId), eq(eventRequests.customerId, customer.id))).limit(1))[0];
  if (!request) return null;
  const [requestQuotes, requestBookings, changes] = await Promise.all([
    db.select().from(quotes).where(eq(quotes.requestId, requestId)).orderBy(desc(quotes.createdAt)),
    db.select().from(bookings).where(eq(bookings.requestId, requestId)).orderBy(desc(bookings.createdAt)),
    db.select().from(bookingChangeRequests).where(eq(bookingChangeRequests.customerId, customer.id)).orderBy(asc(bookingChangeRequests.createdAt)),
  ]);
  return { request, quotes: requestQuotes, bookings: requestBookings, changes: changes.filter((change) => requestBookings.some((booking) => booking.id === change.bookingId)) };
}
