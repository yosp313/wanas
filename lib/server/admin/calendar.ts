import "server-only";

import { and, eq, gte, lt } from "drizzle-orm";
import { requireAdmin } from "../auth/guards";
import { requireDb } from "../db";
import { bookings, eventRequests } from "../db/schema";

function monthBounds(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("INVALID_MONTH");
  const [year, monthNumber] = month.split("-").map(Number);
  if (monthNumber < 1 || monthNumber > 12) throw new Error("INVALID_MONTH");
  const start = `${year.toString().padStart(4, "0")}-${monthNumber.toString().padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(year, monthNumber, 1));
  const end = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export async function getAdminCalendar(month: string, includePending = false) {
  await requireAdmin();
  const db = requireDb();
  const bounds = monthBounds(month);
  const confirmed = await db.select().from(bookings).where(and(eq(bookings.status, "confirmed"), gte(bookings.eventDate, bounds.start), lt(bookings.eventDate, bounds.end)));
  const pending = includePending ? await db.select().from(eventRequests).where(and(eq(eventRequests.status, "submitted"), gte(eventRequests.eventDate, bounds.start), lt(eventRequests.eventDate, bounds.end))) : [];
  return { month, confirmed, pending };
}
