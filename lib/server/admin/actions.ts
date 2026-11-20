"use server";

import { and, eq, sql } from "drizzle-orm";
import { isLocale } from "@/lib/i18n/config";
import { requireAdmin } from "../auth/guards";
import { withMutation, lockDates, readDatabaseClock, type Database } from "../db/transactions";
import { dateReservations, eventRequests, quotes } from "../db/schema";
import { hasMinimumNotice } from "../time/cairo";
import { enqueueNotification } from "../notifications/enqueue";

export type QuoteInput = {
  offeredDate: string;
  services: string;
  totalEgp: number;
  scopeExplanation?: string | null;
};

function assertRequestId(value: string) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("INVALID_REQUEST_ID");
  }
}

function validateQuote(input: QuoteInput) {
  const date = new Date(`${input?.offeredDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.offeredDate) || !Number.isFinite(+date) ||
      date.toISOString().slice(0, 10) !== input.offeredDate) {
    throw new Error("INVALID_OFFERED_DATE");
  }
  if (!Number.isInteger(input.totalEgp) || input.totalEgp < 0 || input.totalEgp > 2_147_483_647) {
    throw new Error("INVALID_TOTAL");
  }
  if (typeof input.services !== "string" || !input.services.trim() || input.services.length > 5000) {
    throw new Error("INVALID_SERVICES");
  }
  if (input.scopeExplanation != null && (typeof input.scopeExplanation !== "string" ||
      input.scopeExplanation.length > 5000)) {
    throw new Error("INVALID_SCOPE_EXPLANATION");
  }
}

async function lockRequest(tx: Database, requestId: string) {
  const [request] = await tx.select().from(eventRequests).where(eq(eventRequests.id, requestId)).for("update");
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (request.status !== "submitted" && request.status !== "quoted") throw new Error("REQUEST_NOT_ACTIONABLE");
  if (!isLocale(request.language)) throw new Error("INVALID_REQUEST_LOCALE");
  return { ...request, language: request.language };
}

async function lockCurrentQuote(tx: Database, requestId: string) {
  const [quote] = await tx.select().from(quotes)
    .where(and(eq(quotes.requestId, requestId), eq(quotes.status, "current"))).for("update");
  return quote;
}

export async function sendQuote(requestId: string, input: QuoteInput) {
  await requireAdmin();
  assertRequestId(requestId);
  validateQuote(input);

  return withMutation(async (tx) => {
    const request = await lockRequest(tx, requestId);
    const current = await lockCurrentQuote(tx, requestId);
    await lockDates(tx, [input.offeredDate, ...(current ? [current.offeredDate] : [])]);
    const [candidate] = await tx.select().from(dateReservations)
      .where(eq(dateReservations.eventDate, input.offeredDate)).for("update");
    const now = await readDatabaseClock(tx);
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    if (!hasMinimumNotice(input.offeredDate, now)) {
      if (input.offeredDate !== request.eventDate) throw new Error("OFFERED_DATE_TOO_SOON");
      const [event] = await tx.execute<{ milliseconds: number }>(
        sql`select extract(epoch from (${input.offeredDate}::date::timestamp at time zone 'Africa/Cairo'))::double precision * 1000 as milliseconds`,
      );
      if (expiresAt.getTime() >= event.milliseconds) throw new Error("ORIGINAL_DATE_HOLD_TOO_LATE");
    }

    if (candidate) {
      const expired = candidate.kind === "hold" && candidate.holdExpiresAt !== null && candidate.holdExpiresAt <= now;
      const sameHold = candidate.kind === "hold" && candidate.quoteId === current?.id;
      if (!expired && !sameHold) throw new Error("DATE_UNAVAILABLE");
    }

    if (current) {
      await tx.update(quotes).set({ status: "superseded", updatedAt: now }).where(eq(quotes.id, current.id));
    }
    const [quote] = await tx.insert(quotes).values({
      requestId,
      offeredDate: input.offeredDate,
      services: input.services.trim(),
      totalEgp: input.totalEgp,
      scopeExplanation: input.scopeExplanation?.trim() || null,
      status: "current",
      expiresAt,
    }).returning();

    const reservation = { kind: "hold", quoteId: quote.id, bookingId: null, holdExpiresAt: expiresAt, updatedAt: now };
    await tx.insert(dateReservations).values({ eventDate: quote.offeredDate, ...reservation })
      .onConflictDoUpdate({ target: dateReservations.eventDate, set: reservation });
    if (current && current.offeredDate !== quote.offeredDate) {
      await tx.delete(dateReservations).where(and(eq(dateReservations.eventDate, current.offeredDate),
        eq(dateReservations.quoteId, current.id)));
    }
    await tx.update(eventRequests).set({ status: "quoted", updatedAt: now }).where(eq(eventRequests.id, requestId));
    await enqueueNotification(tx, {
      type: "quote_ready",
      payload: {
        recipient: request.customerEmail,
        customerName: request.customerName,
        locale: request.language,
        requestId,
        quoteId: quote.id,
        offeredDate: quote.offeredDate,
        totalEgp: quote.totalEgp,
        scopeExplanation: quote.scopeExplanation ?? undefined,
      },
    });
    return quote;
  });
}

export async function declineRequest(requestId: string) {
  await requireAdmin();
  assertRequestId(requestId);

  return withMutation(async (tx) => {
    const request = await lockRequest(tx, requestId);
    const current = await lockCurrentQuote(tx, requestId);
    if (current) await lockDates(tx, [current.offeredDate]);
    const now = await readDatabaseClock(tx);

    if (current) {
      await tx.update(quotes).set({ status: "declined_by_admin", updatedAt: now }).where(eq(quotes.id, current.id));
      await tx.delete(dateReservations).where(and(eq(dateReservations.eventDate, current.offeredDate),
        eq(dateReservations.quoteId, current.id)));
    }
    await tx.update(eventRequests).set({ status: "closed", updatedAt: now }).where(eq(eventRequests.id, requestId));
    await enqueueNotification(tx, {
      type: "request_declined",
      payload: {
        recipient: request.customerEmail,
        customerName: request.customerName,
        locale: request.language,
        requestId,
      },
    });
    return { requestId, status: "closed" as const };
  });
}
