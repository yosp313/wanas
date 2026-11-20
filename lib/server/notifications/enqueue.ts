import { sql } from "drizzle-orm";
import type { NotificationEvent } from "./types";

export type OutboxTransaction = { execute(query: ReturnType<typeof sql>): Promise<unknown> };

/** Call this inside the same Drizzle transaction as the business mutation. */
export async function enqueueNotification(tx: OutboxTransaction, event: NotificationEvent): Promise<void> {
  await tx.execute(sql`
    insert into notification_outbox (request_id, quote_id, booking_id, kind, language, payload)
    values (
      ${event.payload.requestId}, ${event.payload.quoteId ?? null}, ${event.payload.bookingId ?? null},
      ${event.type}, ${event.payload.locale}, ${JSON.stringify(event.payload)}::jsonb
    )
  `);
}
