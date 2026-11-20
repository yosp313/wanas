"use server";

import { and, eq, inArray } from "drizzle-orm";
import { requireAdmin, requireCustomer } from "../auth/guards";
import { withMutation, lockDates, readDatabaseClock } from "../db/transactions";
import type { Database } from "../db";
import { bookingChangeRequests, bookingRevisions, bookings, dateReservations, eventRequests } from "../db/schema";
import { isWithinBookingChangeCutoff, hasMinimumNotice } from "../time/cairo";
import { enqueueNotification } from "../notifications/enqueue";

export type BookingChange = { kind: "cancellation" | "reschedule" | "scope"; newDate?: string; notes?: string };
export type BookingAgreement = { services?: unknown; totalEgp?: number; scopeExplanation?: string | null; notes?: string | null };

function uuid(value: string, name: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`INVALID_${name.toUpperCase()}`);
}
function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_DATE");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE");
}
function validateChange(change: BookingChange) {
  if (!change || !["cancellation", "reschedule", "scope"].includes(change.kind)) throw new Error("INVALID_CHANGE");
  if (change.kind === "reschedule") { if (!change.newDate) throw new Error("NEW_DATE_REQUIRED"); date(change.newDate); }
  if (change.notes !== undefined && typeof change.notes !== "string") throw new Error("INVALID_CHANGE_NOTES");
}
function validateAgreement(agreement: BookingAgreement) {
  if (!agreement || typeof agreement !== "object" || Array.isArray(agreement)) throw new Error("INVALID_AGREEMENT");
  if (agreement.services !== undefined && (agreement.services === null || typeof agreement.services !== "object")) throw new Error("INVALID_SERVICES");
  if (agreement.scopeExplanation !== undefined && agreement.scopeExplanation !== null && typeof agreement.scopeExplanation !== "string") throw new Error("INVALID_SCOPE_EXPLANATION");
  if (agreement.notes !== undefined && agreement.notes !== null && typeof agreement.notes !== "string") throw new Error("INVALID_AGREEMENT_NOTES");
  if (agreement.totalEgp !== undefined && (!Number.isInteger(agreement.totalEgp) || agreement.totalEgp < 0)) throw new Error("INVALID_TOTAL");
}

function sameChange(left: unknown, right: BookingChange) {
  const candidate = left as Partial<BookingChange> | null;
  return candidate?.kind === right.kind && candidate.newDate === right.newDate && candidate.notes === right.notes;
}

async function getBooking(tx: Database, bookingId: string) {
  const rows = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).for("update");
  if (!rows[0]) throw new Error("BOOKING_NOT_FOUND");
  return rows[0];
}

export async function requestBookingChange(bookingId: string, seenRevision: number, change: BookingChange) {
  const customer = await requireCustomer();
  uuid(bookingId, "booking_id");
  if (!Number.isInteger(seenRevision) || seenRevision < 1) throw new Error("INVALID_REVISION");
  validateChange(change);
  return withMutation(async (tx) => {
    const booking = await getBooking(tx, bookingId);

    const requestRows = await tx.select({ customerId: eventRequests.customerId }).from(eventRequests).where(and(eq(eventRequests.id, booking.requestId), eq(eventRequests.customerId, customer.id))).limit(1);
    if (!requestRows[0]) throw new Error("BOOKING_NOT_FOUND");
    if (seenRevision > booking.revision) throw new Error("INVALID_REVISION");
    const now = await readDatabaseClock(tx);
    if (booking.status !== "confirmed") throw new Error("BOOKING_NOT_ACTIVE");
    if (!isWithinBookingChangeCutoff(booking.eventDate, now)) throw new Error("BOOKING_CHANGE_CUTOFF_PASSED");
    const existing = await tx.select().from(bookingChangeRequests).where(and(eq(bookingChangeRequests.bookingId, bookingId), eq(bookingChangeRequests.customerId, customer.id), eq(bookingChangeRequests.revision, seenRevision), eq(bookingChangeRequests.status, "pending")));
    const duplicate = existing.find((candidate) => sameChange(candidate.change, change));
    if (duplicate) return duplicate;
    const inserted = await tx.insert(bookingChangeRequests).values({ bookingId, customerId: customer.id, revision: seenRevision, change }).returning();
    if (!inserted[0]) throw new Error("CHANGE_NOT_CREATED");
    return inserted[0];
  });
}

export async function applyBookingChange(changeRequestId: string, reviewedRevision: number, agreement: BookingAgreement) {
  const admin = await requireAdmin();
  uuid(changeRequestId, "change_request_id");
  if (!Number.isInteger(reviewedRevision) || reviewedRevision < 1) throw new Error("INVALID_REVISION");
  validateAgreement(agreement);
  return withMutation(async (tx) => {
    // Read the request id without locking, then take the booking lock first.
    // Customer retries lock booking before looking for a duplicate request.
    const changeRef = (await tx.select({ bookingId: bookingChangeRequests.bookingId }).from(bookingChangeRequests).where(eq(bookingChangeRequests.id, changeRequestId)).limit(1))[0];
    if (!changeRef) throw new Error("CHANGE_NOT_FOUND");
    const booking = await getBooking(tx, changeRef.bookingId);
    const change = (await tx.select().from(bookingChangeRequests).where(eq(bookingChangeRequests.id, changeRequestId)).for("update"))[0];
    if (!change) throw new Error("CHANGE_NOT_FOUND");
    if (change.status === "applied") return booking;
    if (change.status !== "pending") throw new Error("CHANGE_NOT_PENDING");
    if (reviewedRevision !== booking.revision) throw new Error("STALE_BOOKING_REVISION");
    const requested = change.change as BookingChange;
    const destination = requested.kind === "reschedule" ? requested.newDate! : booking.eventDate;
    if (requested.kind === "reschedule" && destination === booking.eventDate) throw new Error("DATE_UNCHANGED");
    const dates = destination === booking.eventDate ? [booking.eventDate] : [destination, booking.eventDate];
    await lockDates(tx, dates);
    const reservations = await tx.select().from(dateReservations)
      .where(inArray(dateReservations.eventDate, dates)).orderBy(dateReservations.eventDate).for("update");
    const now = await readDatabaseClock(tx);
    if (booking.status !== "confirmed") throw new Error("BOOKING_NOT_ACTIVE");
    if (!isWithinBookingChangeCutoff(booking.eventDate, now)) throw new Error("BOOKING_CHANGE_CUTOFF_PASSED");
    if (requested.kind === "reschedule" && !hasMinimumNotice(destination, now)) throw new Error("DESTINATION_TOO_SOON");
    const original = reservations.find((reservation) => reservation.eventDate === booking.eventDate);
    if (!original || original.kind !== "booking" || original.bookingId !== booking.id) throw new Error("BOOKING_RESERVATION_MISSING");
    if (requested.kind === "reschedule") {
      const target = reservations.find((reservation) => reservation.eventDate === destination);
      if (target && (target.kind === "booking" || (target.holdExpiresAt && target.holdExpiresAt > now))) throw new Error("DATE_UNAVAILABLE");
      if (target) await tx.delete(dateReservations).where(eq(dateReservations.eventDate, destination));
      await tx.insert(dateReservations).values({ eventDate: destination, kind: "booking", quoteId: null, bookingId: booking.id, holdExpiresAt: null, updatedAt: now });
      await tx.delete(dateReservations).where(eq(dateReservations.eventDate, booking.eventDate));
    } else if (requested.kind === "cancellation") {
      await tx.delete(dateReservations).where(eq(dateReservations.eventDate, booking.eventDate));
    }
    const nextRevision = booking.revision + 1;
    const previous = (await tx.select().from(bookingRevisions).where(and(eq(bookingRevisions.bookingId, booking.id), eq(bookingRevisions.revision, booking.revision))).limit(1))[0];
    const priorTerms = (previous?.terms ?? {}) as Record<string, unknown>;
    const terms = { ...priorTerms, ...agreement, change: requested };
    await tx.insert(bookingRevisions).values({ bookingId: booking.id, revision: nextRevision, eventDate: destination, terms, agreedBy: admin.id, agreedAt: now });
    const status = requested.kind === "cancellation" ? "cancelled" : "confirmed";
    const updated = (await tx.update(bookings).set({ eventDate: destination, revision: nextRevision, status, updatedAt: now }).where(eq(bookings.id, booking.id)).returning())[0];
    await tx.update(bookingChangeRequests).set({ status: "applied", updatedAt: now }).where(eq(bookingChangeRequests.id, change.id));
    const request = (await tx.select().from(eventRequests).where(eq(eventRequests.id, booking.requestId)).limit(1))[0];
    if (!request || !updated) throw new Error("BOOKING_NOT_UPDATED");
    if (requested.kind === "cancellation" || requested.kind === "reschedule") await enqueueNotification(tx, { type: requested.kind === "cancellation" ? "booking_cancelled" : "booking_rescheduled", payload: { requestId: request.id, bookingId: booking.id, recipient: request.customerEmail, customerName: request.customerName, locale: request.language as "ar" | "en", offeredDate: booking.eventDate, newDate: destination, explanation: requested.notes } });
    return updated;
  });
}
