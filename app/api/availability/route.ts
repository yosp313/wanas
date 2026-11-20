import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { requireDb } from "@/lib/server/db";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Public availability contract. Phase 1 supplies the reservation reader during
 * integration. This route never ships catalog or fake reservation fixtures.
 */
export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month");
  if (!month || !monthPattern.test(month)) {
    return NextResponse.json({ error: "month must use YYYY-MM" }, { status: 400 });
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  try {
    const rows = await requireDb().execute(sql`select event_date as date, kind, hold_expires_at as "holdExpiresAt" from date_reservations where event_date >= ${start} and event_date < ${end} and (kind = 'booking' or hold_expires_at > clock_timestamp()) order by event_date`);
    const dates = rows.map((row) => ({ date: String((row as { date: string }).date), status: (row as { kind: string }).kind === "booking" ? "booked" : "held" }));
    return NextResponse.json({ month, dates }, { headers: { "cache-control": "no-store" } });
  } catch (error) { if (error instanceof Error && error.message.includes("DATABASE_URL")) return NextResponse.json({ error: "availability unavailable" }, { status: 503, headers: { "cache-control": "no-store" } }); throw error; }
}
