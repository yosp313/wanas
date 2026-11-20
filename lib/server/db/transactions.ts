import "server-only";
import { sql } from "drizzle-orm";
import { requireDb, type Database } from ".";
export async function withMutation<T>(operation: (tx: Database) => Promise<T>) { return requireDb().transaction(async (tx) => operation(tx as unknown as Database)); }
/** Advisory locks are always acquired in ascending date order. */
export async function lockDate(tx: Database, eventDate: string) { await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${eventDate}, 0))`); }
export async function lockDates(tx: Database, dates: string[]) { for (const eventDate of [...dates].sort()) await lockDate(tx, eventDate); }
export async function readDatabaseClock(tx: Database) { const result = await tx.execute<{ now: Date }>(sql`select clock_timestamp() as now`); return result[0].now; }

export type { Database } from ".";
