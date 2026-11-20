"use server";

import { applyBookingChange, requestBookingChange, type BookingAgreement, type BookingChange } from "@/lib/server/bookings/actions";

export type BookingActionResult = { ok: true } | { ok: false; code: string };

function errorCode(error: unknown) {
  return error instanceof Error ? error.message : "UNKNOWN_ERROR";
}

export async function submitBookingChange(bookingId: string, revision: number, change: BookingChange): Promise<BookingActionResult> {
  try { await requestBookingChange(bookingId, revision, change); return { ok: true }; }
  catch (error) { return { ok: false, code: errorCode(error) }; }
}

export async function submitBookingAgreement(changeRequestId: string, reviewedRevision: number, agreement: BookingAgreement): Promise<BookingActionResult> {
  try { await applyBookingChange(changeRequestId, reviewedRevision, agreement); return { ok: true }; }
  catch (error) { return { ok: false, code: errorCode(error) }; }
}
