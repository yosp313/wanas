import "server-only";
import { sql } from "drizzle-orm";
import { requireDb, type Database } from ".";
export async function withMutation<T>(operation: (tx: Database) => Promise<T>) { return requireDb().transaction(async (tx) => operation(tx as unknown as Database)); }
/** Advisory locks are always acquired in ascending date order. */
export async function lockDate(tx: Database, eventDate: string) { await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${eventDate}, 0))`); }
export async function lockDates(tx: Database, dates: string[]) {
  for (const eventDate of [...new Set(dates)].sort()) await lockDate(tx, eventDate);
}

export async function readDatabaseClock(tx: Database) {
  const [result] = await tx.execute<{ milliseconds: number }>(
    sql`select extract(epoch from clock_timestamp())::double precision * 1000 as milliseconds`,
  );
  return new Date(result.milliseconds);
}

export type { Database } from ".";
