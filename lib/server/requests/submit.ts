import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireCustomer } from "@/lib/server/auth/guards";
import { enqueueNotification } from "@/lib/server/notifications/enqueue";
import { withMutation, lockDate, readDatabaseClock } from "@/lib/server/db/transactions";
import { eventRequests } from "@/lib/server/db/schema";
import { requestSnapshot } from "@/lib/planner/request-snapshot";
import { isCatalogId } from "@/lib/catalog/catalog";
import { hasMinimumNotice } from "@/lib/server/time/cairo";
import type { PlannerDraft } from "@/lib/planner/types";

export type SubmitResult = { requestId: string; existing: boolean };

function fail(message: string): never { throw new Error(`VALIDATION:${message}`); }
const text = z.string().trim();
const draftSchema = z.object({
  locale: z.enum(["ar", "en"]),
  eventType: text.min(1),
  eventTypeOther: text.max(200),
  guestCount: z.number().int().min(1).max(100_000),
  eventDate: z.iso.date(),
  venueName: text.min(1).max(200),
  streetAddress: text.min(1).max(500),
  venueType: text.min(1),
  venueTypeOther: text.max(200),
  budgetRange: text.min(1),
  decorMode: z.enum(["curate", "customize"]),
  moodboard: text.max(100),
  palette: text.max(100),
  decorElements: z.array(text).max(20),
  cateringRequested: z.boolean(),
  cateringOption: text.max(100),
  notes: text.max(5000),
  inspirationLinks: text.max(2000),
  customerName: text.min(1).max(200),
  mobile: text.regex(/^\+?[\p{Nd} ()-]{7,25}$/u).refine((value) => (value.match(/\p{Nd}/gu)?.length ?? 0) >= 7),
});

function validate(input: PlannerDraft) {
  const result = draftSchema.safeParse(input);
  if (!result.success) fail("INVALID_DRAFT");
  const draft = result.data;
  if (!isCatalogId("eventTypes", draft.eventType) || !isCatalogId("venueTypes", draft.venueType) ||
      !isCatalogId("budgetRanges", draft.budgetRange) || !isCatalogId("decorModes", draft.decorMode)) {
    fail("INVALID_CHOICE");
  }
  if ((draft.eventType === "other" && !draft.eventTypeOther) || (draft.venueType === "other" && !draft.venueTypeOther)) {
    fail("MISSING_DESCRIPTION");
  }
  if ((draft.moodboard && !isCatalogId("moodboards", draft.moodboard)) ||
      (draft.palette && !isCatalogId("palettes", draft.palette)) ||
      draft.decorElements.some((id) => !isCatalogId("decorElements", id))) {
    fail("INVALID_CHOICE");
  }
  if ((draft.cateringRequested || draft.cateringOption) && !isCatalogId("cateringOptions", draft.cateringOption)) {
    fail("INVALID_CATERING");
  }
  for (const link of draft.inspirationLinks.split(/\s+/).filter(Boolean)) {
    const url = URL.parse(link);
    if (!url || !["https:", "http:"].includes(url.protocol)) fail("INVALID_INSPIRATION_LINK");
  }
  return { ...draft, decorElements: [...new Set(draft.decorElements)] };
}

export async function submitRequest(input: PlannerDraft, submissionId: string): Promise<SubmitResult> {
  const customer = await requireCustomer();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) fail("INVALID_SUBMISSION_ID");
  if (!customer.email) throw new Error("AUTH_EMAIL_REQUIRED");
  const customerEmail = customer.email;
  return withMutation(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${customer.id}:${submissionId}`}, 0))`);
    const submission = and(eq(eventRequests.customerId, customer.id), eq(eventRequests.submissionId, submissionId));
    const existing = await tx.select({ id: eventRequests.id }).from(eventRequests).where(submission).limit(1);
    if (existing[0]) return { requestId: existing[0].id, existing: true };
    const draft = validate(input);
    await lockDate(tx, draft.eventDate);
    const now = await readDatabaseClock(tx);
    if (!hasMinimumNotice(draft.eventDate, now)) fail("DATE_NOTICE");
    const reserved = await tx.execute(sql`select 1 from date_reservations where event_date = ${draft.eventDate} and kind = 'booking' limit 1`);
    if (reserved.length) fail("DATE_UNAVAILABLE");
    const inserted = await tx.insert(eventRequests).values({ customerId: customer.id, submissionId, language: draft.locale, customerEmail, customerName: draft.customerName.trim(), customerMobile: draft.mobile.trim(), eventDate: draft.eventDate, details: requestSnapshot(draft) }).onConflictDoNothing({ target: [eventRequests.customerId, eventRequests.submissionId] }).returning({ id: eventRequests.id });
    if (!inserted[0]) {
      const replay = await tx.select({ id: eventRequests.id }).from(eventRequests).where(submission).limit(1);
      if (replay[0]) return { requestId: replay[0].id, existing: true };
      throw new Error("REQUEST_INSERT_FAILED");
    }
    const requestId = inserted[0]?.id;
    if (!requestId) throw new Error("REQUEST_INSERT_FAILED");
    await enqueueNotification(tx, { type: "request_submitted", payload: { requestId, recipient: customerEmail, customerName: draft.customerName.trim(), locale: draft.locale } });
    return { requestId, existing: false };
  });
}
