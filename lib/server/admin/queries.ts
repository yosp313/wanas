import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { requireDb } from "../db";
import { eventRequests, quotes, dateReservations } from "../db/schema";

export async function getAdminInbox() {
  await requireAdmin();
  const db = requireDb();
  return db.select().from(eventRequests).where(inArray(eventRequests.status, ["submitted", "quoted"])).orderBy(desc(eventRequests.createdAt));
}

export async function getAdminRequest(requestId: string) {
  await requireAdmin();
  const db = requireDb();
  const request = (await db.select().from(eventRequests).where(eq(eventRequests.id, requestId)).limit(1))[0];
  if (!request) return null;
  const requestQuotes = await db.select().from(quotes).where(eq(quotes.requestId, requestId)).orderBy(desc(quotes.createdAt));
  const reservations = await db.select().from(dateReservations).where(inArray(dateReservations.eventDate, [request.eventDate, ...requestQuotes.map((quote) => quote.offeredDate)]));
  return { request, quotes: requestQuotes, reservations };
}
