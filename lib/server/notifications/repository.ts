import "server-only";
import { sql } from "drizzle-orm";
import { requireDb } from "../db";
import type { NotificationJob, NotificationRepository, NotificationPayload, NotificationType } from "./types";

type OutboxRow = { id: string; claim_token: string; kind: NotificationType; payload: NotificationPayload; attempts: number };
const asJob = (row: OutboxRow): NotificationJob => ({ id: row.id, claimToken: row.claim_token, type: row.kind, payload: row.payload, attempts: row.attempts });

const guarded = (id: string, claimToken: string) => sql`id = ${id} and claim_token = ${claimToken} and status = 'processing'`;

export const notificationRepository: NotificationRepository = {
  async claimDue(_now, leaseMs, limit) {
    const db = requireDb();
    const result = await db.transaction((tx) => tx.execute<OutboxRow>(sql`
      with due as (
        select id from notification_outbox
        where next_attempt_at <= statement_timestamp() and (status = 'pending' or (status = 'processing' and claim_expires_at <= statement_timestamp()))
        order by next_attempt_at, created_at
        for update skip locked limit ${limit}
      )
      update notification_outbox o
      set status = 'processing', claim_token = gen_random_uuid(),
          claim_expires_at = statement_timestamp() + ${leaseMs} * interval '1 millisecond',
          last_attempt_at = statement_timestamp(), attempts = o.attempts + 1, updated_at = statement_timestamp()
      from due where o.id = due.id
      returning o.id, o.claim_token, o.kind, o.payload, o.attempts
    `));
    return result.map(asJob);
  },
  async markSent(id, claimToken, at) {
    await requireDb().execute(sql`update notification_outbox set status = 'sent', claim_token = null, claim_expires_at = null, updated_at = ${at} where ${guarded(id, claimToken)}`);
  },
  async markSkipped(id, claimToken, reason, at) {
    await requireDb().execute(sql`update notification_outbox set status = 'skipped', provider_error = ${reason}, claim_token = null, claim_expires_at = null, updated_at = ${at} where ${guarded(id, claimToken)}`);
  },
  async scheduleRetry(id, claimToken, nextAttemptAt, errorCode, at) {
    await requireDb().execute(sql`update notification_outbox set status = 'pending', next_attempt_at = ${nextAttemptAt}, provider_error = ${errorCode}, claim_token = null, claim_expires_at = null, updated_at = ${at} where ${guarded(id, claimToken)}`);
  },
  async markFailed(id, claimToken, errorCode, at) {
    await requireDb().execute(sql`update notification_outbox set status = 'failed', provider_error = ${errorCode}, claim_token = null, claim_expires_at = null, updated_at = ${at} where ${guarded(id, claimToken)}`);
  },
  async checkQuote(job) {
    if (!job.payload.quoteId) return "obsolete";
    const result = await requireDb().execute(sql`
      select 1 from quotes q
      join date_reservations r on r.quote_id = q.id and r.event_date = q.offered_date
      where q.id = ${job.payload.quoteId} and q.request_id = ${job.payload.requestId}
        and q.status = 'current' and q.expires_at > statement_timestamp()
        and r.kind = 'hold' and r.hold_expires_at > statement_timestamp()
    `);
    return result.length > 0 ? "current" : "obsolete";
  },
};

export function getNotificationRepository(): NotificationRepository {
  return notificationRepository;
}
