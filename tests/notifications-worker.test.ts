import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processNotifications } from "../lib/server/notifications/worker";
import type { NotificationJob, NotificationRepository } from "../lib/server/notifications/types";

function repoFor(job: NotificationJob, checkQuote?: "current" | "obsolete") {
  const calls: string[] = [];
  const repo: NotificationRepository = {
    async claimDue() { return [job]; }, async markSent() { calls.push("sent"); }, async markSkipped() { calls.push("skipped"); }, async scheduleRetry() { calls.push("retry"); }, async markFailed() { calls.push("failed"); },
    ...(checkQuote ? { async checkQuote() { return checkQuote; } } : {}),
  };
  return { repo, calls };
}

const job: NotificationJob = { id: "job-1", claimToken: "claim-1", type: "request_submitted", attempts: 1, payload: { recipient: "customer@example.com", requestId: "request-1", locale: "en" } };

describe("notification worker", () => {
  it("uses one stable idempotency key and marks successful delivery", async () => {
    const { repo, calls } = repoFor(job);
    const requests: RequestInit[] = [];
    const fetcher = async (_url: string | URL | Request, init?: RequestInit) => { if (init) requests.push(init); return new Response("{}", { status: 200 }); };
    await processNotifications(repo, { appOrigin: "https://w.example", resendApiKey: "key", emailFrom: "WANAS <mail@w.example>", fetcher });
    assert.deepEqual(calls, ["sent"]);
    assert.equal(new Headers(requests[0]?.headers).get("Idempotency-Key"), "notification:job-1");
  });
  it("skips a quote that is no longer current", async () => {
    const quoteJob = { ...job, type: "quote_ready" as const };
    const { repo, calls } = repoFor(quoteJob, "obsolete");
    const result = await processNotifications(repo, { appOrigin: "https://w.example", resendApiKey: "key", emailFrom: "x@y.example" });
    assert.equal(result.skipped, 1); assert.deepEqual(calls, ["skipped"]);
  });
  it("schedules a transient provider failure without changing the idempotency key", async () => {
    const { repo, calls } = repoFor(job);
    const fetcher = async () => new Response(JSON.stringify({ name: "rate_limit" }), { status: 429 });
    const result = await processNotifications(repo, { appOrigin: "https://w.example", resendApiKey: "key", emailFrom: "x@y.example", fetcher });
    assert.equal(result.failed, 0); assert.deepEqual(calls, ["retry"]);
  });
  it("marks a transient failure permanent after the final retry", async () => {
    const { repo, calls } = repoFor({ ...job, attempts: 5 });
    const fetcher = async () => new Response(JSON.stringify({ name: "upstream" }), { status: 503 });
    const result = await processNotifications(repo, { appOrigin: "https://w.example", resendApiKey: "key", emailFrom: "x@y.example", fetcher });
    assert.equal(result.failed, 1); assert.deepEqual(calls, ["failed"]);
  });
});
