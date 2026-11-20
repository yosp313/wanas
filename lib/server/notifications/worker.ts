import { renderNotification } from "./templates";
import { ResendError, sendWithResend } from "./resend";
import type { NotificationRepository } from "./types";

export const RETRY_DELAYS_MS = [5 * 60_000, 15 * 60_000, 60 * 60_000, 4 * 60 * 60_000];

export type WorkerConfig = { appOrigin: string; resendApiKey: string; emailFrom: string; now?: () => Date; logger?: Pick<Console, "error">; fetcher?: typeof fetch };

export async function processNotifications(repo: NotificationRepository, config: WorkerConfig, limit = 25): Promise<{ claimed: number; sent: number; skipped: number; failed: number }> {
  const now = config.now ?? (() => new Date());
  const jobs = await repo.claimDue(now(), 10 * 60_000, limit);
  const result = { claimed: jobs.length, sent: 0, skipped: 0, failed: 0 };
  for (const job of jobs) {
    const attemptAt = now();
    if (job.type === "quote_ready" && repo.checkQuote && await repo.checkQuote(job, attemptAt) === "obsolete") {
      await repo.markSkipped(job.id, job.claimToken, "quote_obsolete", attemptAt);
      result.skipped++;
      continue;
    }
    try {
      await sendWithResend(renderNotification(job, config.appOrigin), `notification:${job.id}`, config.resendApiKey, config.emailFrom, config.fetcher);
    } catch (error) {
      const resend = error instanceof ResendError ? error : new ResendError("network_error", true);
      config.logger?.error({ jobId: job.id, providerCode: resend.code });
      const retryIndex = job.attempts - 1;
      if (resend.transient && retryIndex < RETRY_DELAYS_MS.length) {
        await repo.scheduleRetry(job.id, job.claimToken, new Date(attemptAt.getTime() + RETRY_DELAYS_MS[retryIndex]), resend.code, attemptAt);
      } else {
        await repo.markFailed(job.id, job.claimToken, resend.code, attemptAt);
        result.failed++;
      }
      continue;
    }
    await repo.markSent(job.id, job.claimToken, now());
    result.sent++;
  }
  return result;
}
