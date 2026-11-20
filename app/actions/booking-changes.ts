"use server";

import { applyBookingChange, requestBookingChange, type BookingAgreement, type BookingChange } from "@/lib/server/bookings/actions";

export type BookingActionResult = { ok: true } | { ok: false; code: string };

function errorCode(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const known = [
    "AUTH_REQUIRED", "ADMIN_REQUIRED", "BOOKING_NOT_ACTIVE", "BOOKING_CHANGE_CUTOFF_PASSED",
    "STALE_BOOKING_REVISION", "DATE_UNAVAILABLE", "DESTINATION_TOO_SOON", "DATE_UNCHANGED",
    "INVALID_AGREEMENT", "INVALID_CHANGE", "INVALID_TOTAL", "INVALID_REVISION",
  ];
  return known.includes(code) ? code : "UNAVAILABLE";
}

export async function submitBookingChange(bookingId: string, revision: number, change: BookingChange): Promise<BookingActionResult> {
  try { await requestBookingChange(bookingId, revision, change); return { ok: true }; }
  catch (error) { return { ok: false, code: errorCode(error) }; }
}

export async function submitBookingAgreement(changeRequestId: string, reviewedRevision: number, agreement: BookingAgreement): Promise<BookingActionResult> {
  try { await applyBookingChange(changeRequestId, reviewedRevision, agreement); return { ok: true }; }
  catch (error) { return { ok: false, code: errorCode(error) }; }
}
