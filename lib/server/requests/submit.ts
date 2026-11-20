import "server-only";
import { sql } from "drizzle-orm";
import { requireCustomer } from "@/lib/server/auth/guards";
import { enqueueNotification } from "@/lib/server/notifications/enqueue";
import { withMutation, lockDate, readDatabaseClock } from "@/lib/server/db/transactions";
import { eventRequests } from "@/lib/server/db/schema";
import { requestSnapshot } from "@/lib/planner/request-snapshot";
import { isCatalogId } from "@/lib/catalog/catalog";
import { hasMinimumNotice } from "@/lib/server/time/cairo";
import { isLocale } from "@/lib/i18n/config";
import type { PlannerDraft } from "@/lib/planner/types";

export type SubmitResult = { requestId: string; existing: boolean };

function fail(message: string): never { throw new Error(`VALIDATION:${message}`); }
function validate(draft: PlannerDraft) {
  if (!draft || typeof draft !== "object") fail("draft is required");
  for (const field of ["eventType", "eventDate", "venueName", "streetAddress", "venueType", "budgetRange", "decorMode", "customerName", "mobile"] as const) if (typeof draft[field] !== "string" || !draft[field].trim()) fail(`${field} is required`);
  if (!Number.isInteger(draft.guestCount) || Number(draft.guestCount) < 1) fail("guestCount must be positive");
  if (!isCatalogId("eventTypes", draft.eventType) || !isCatalogId("venueTypes", draft.venueType) || !isCatalogId("budgetRanges", draft.budgetRange) || !isCatalogId("decorModes", draft.decorMode)) fail("unknown catalog option");
  if (draft.eventType === "other" && !draft.eventTypeOther.trim()) fail("eventTypeOther is required");
  if (draft.venueType === "other" && !draft.venueTypeOther.trim()) fail("venueTypeOther is required");
  if (draft.decorMode === "customize" && (!isCatalogId("moodboards", draft.moodboard) || !isCatalogId("palettes", draft.palette))) fail("custom decor choices are incomplete");
  if (!Array.isArray(draft.decorElements) || draft.decorElements.some((id) => !isCatalogId("decorElements", id))) fail("unknown decor element");
  if (draft.cateringRequested && !isCatalogId("cateringOptions", draft.cateringOption)) fail("cateringOption is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.eventDate)) fail("eventDate is invalid");
  const parsedDate = new Date(`${draft.eventDate}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== draft.eventDate) fail("eventDate is invalid");
  if (!isLocale(draft.locale)) fail("locale is invalid");
}

export async function submitRequest(draft: PlannerDraft, submissionId: string): Promise<SubmitResult> {
  const customer = await requireCustomer();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) fail("submissionId is invalid");
  if (!customer.email) throw new Error("AUTH_EMAIL_REQUIRED");
  const customerEmail = customer.email;
  return withMutation(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${customer.id}:${submissionId}`}, 0))`);
    const existing = await tx.select({ id: eventRequests.id }).from(eventRequests).where(sql`customer_id = ${customer.id} and submission_id = ${submissionId}`).limit(1);
    if (existing[0]) return { requestId: existing[0].id, existing: true };
    validate(draft);
    await lockDate(tx, draft.eventDate);
    const now = await readDatabaseClock(tx);
    if (!hasMinimumNotice(draft.eventDate, now)) fail("eventDate requires 10 days notice");
    const reserved = await tx.execute(sql`select 1 from date_reservations where event_date = ${draft.eventDate} and kind = 'booking' limit 1`);
    if (reserved.length) fail("eventDate is unavailable");
    const inserted = await tx.insert(eventRequests).values({ customerId: customer.id, submissionId, language: draft.locale, customerEmail, customerName: draft.customerName.trim(), customerMobile: draft.mobile.trim(), eventDate: draft.eventDate, details: requestSnapshot(draft) }).onConflictDoNothing({ target: [eventRequests.customerId, eventRequests.submissionId] }).returning({ id: eventRequests.id });
    if (!inserted[0]) {
      const replay = await tx.select({ id: eventRequests.id }).from(eventRequests).where(sql`customer_id = ${customer.id} and submission_id = ${submissionId}`).limit(1);
      if (replay[0]) return { requestId: replay[0].id, existing: true };
      throw new Error("REQUEST_INSERT_FAILED");
    }
    const requestId = inserted[0]?.id;
    if (!requestId) throw new Error("REQUEST_INSERT_FAILED");
    await enqueueNotification(tx, { type: "request_submitted", payload: { requestId, recipient: customerEmail, customerName: draft.customerName.trim(), locale: draft.locale } });
    return { requestId, existing: false };
  });
}
