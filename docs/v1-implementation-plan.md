# WANAS v1 implementation plan

This is the original v1 plan. The app now uses Clerk for sign-in. See the [Clerk migration plan](clerk-auth-implementation-plan.md) for the current authentication design.

1. A visitor browses WANAS decor, plans an event in Arabic or English, and signs in by email code to submit the completed request.
2. An invited admin checks supplier availability, reviews the original request, and sends a quote with one total in EGP and a 48-hour hold.
3. The customer responds from My requests. Acceptance confirms the offered date and puts the booking on the admin calendar without a payment step.
4. The customer requests a booking change, cancellation, or reschedule. An admin applies the agreement before the Cairo cutoff.
5. The customer receives localized email at each specified milestone. Admins see delivery failures that need attention.

UI mockups: [Event scope and venue](../stitch-exports/event-scope-venue-estimator.png), [catering](../stitch-exports/event-scope-catering-estimator.png), [moodboard selection](../stitch-exports/moodboards-theme-selection.jpg).

## Code at the start of the project

- `Home()` in `app/page.tsx` is the starter homepage. Replace its Next.js links with WANAS decor examples and **Plan your event** on the localized homepage.
- `RootLayout()` in `app/layout.tsx` owns the document element and currently hard-codes `lang="en"`. Move document language and direction to the locale layout.
- `nextConfig` in [next.config.ts](../next.config.ts#L3) enables Cache Components. Keep live availability and authorization-dependent reads outside shared caches.

---

## End-to-end flow

```text
CUSTOMER                               WANAS ADMIN                       EMAIL WORKER
Browse /ar or /en
  │ Plan in a guest tab
  │ Email code → completed review
  │ submitRequest(draft, submissionId)
  ├──────────────────────────────────▶ Review immutable request ──────▶ Submission email
  │                                      │ Check suppliers
  │                                      │ Decline request ────────────▶ Request declined email
  │                                      │ Or sendQuote(requestId, offer)
  │◀─────────────────────────────────────┤ Current quote, 48-hour hold ▶ Quote ready email
  │ acceptQuote(requestId, quoteId)
  ├──────────────────────────────────▶ Hold becomes a booking ─────────▶ Booking confirmed email
  │                                      │ Calendar shows booking
  │                                      │ Inbox flags competing requests
  │
  │ requestBookingChange(bookingId, revision, change)
  └──────────────────────────────────▶ Review revision and Cairo cutoff
                                         │ Apply agreed change
                                         └─ Cancel or reschedule ───────▶ Localized outcome email

Quote decline or expiry releases the hold. Withdrawal closes an unbooked request.
```

---

## Decisions

The current app supplies the route and caching constraints. The product scope, technical design, and ADRs define the new business rules.

| Topic | Decision | Why |
|---|---|---|
| Application and access | **One Next.js app with server-only business operations.** Server Actions validate inputs, verify Supabase identity and ownership or `is_admin`, then call Drizzle. The browser uses Supabase Auth. | `nextConfig` enables Cache Components, so protected reads must be request-scoped. The [technical design](v1-technical-design.md#application-and-access) keeps business data off the Supabase Data API. The [access ADR](adr/0002-require-an-account-at-submission.md) reserves staff rights for invited admins. |
| Language and entry routes | **Arabic by default with equivalent `/ar` and `/en` routes.** Remember the language preference and save the submission language on the request. | `RootLayout()` currently emits one English document. The [language ADR](adr/0003-launch-in-english-and-arabic.md) requires Arabic direction and a language switch everywhere. Request language also drives emails and custom quote notes. |
| Planner | **One complete planner with two decor modes and optional catering.** Use a shared bilingual catalog with stable IDs and one EGP budget range. Store a stable submission ID in the tab draft. | `Home()` currently offers only starter links. The [planner scope](v1-product-scope.md#customer-planner) calls for a WANAS entry point and guest planning, and the [technical design](v1-technical-design.md#planner-and-localization) requires the same draft after sign-in and one request per submission retry. |
| Capacity and dates | **One reservation row per Cairo date.** Convert holds to bookings atomically. Expose live month availability with held dates selectable and booked dates disabled. | `nextConfig` enables Cache Components, while the [reservation design](v1-technical-design.md#date-reservations) requires live availability. The [capacity ADR](adr/0004-enforce-booking-capacity-in-postgres.md) requires Postgres to prevent double bookings. The [booking ADR](adr/0001-confirm-bookings-by-quote-acceptance.md) sets the notice and hold rules. |
| Request, quote, and booking history | **Keep the submitted request and quote terms as snapshots.** Create a new quote for replacement or resend, accept only the current quote and its live hold, and record later agreements against booking revisions. | The [technical design](v1-technical-design.md#requests-quotes-and-bookings) requires comparison with the original request and review of changes submitted against stale revisions. The [booking ADR](adr/0001-confirm-bookings-by-quote-acceptance.md) ties confirmation to acceptance. |
| Notifications | **Postgres outbox, Supabase Cron, and Resend.** Enqueue in the same transaction as each qualifying write. Check the quote and hold before each quote email attempt. | The [email design](v1-technical-design.md#email-delivery) requires durable retries and skips obsolete quote email, while the [product scope](v1-product-scope.md#review-and-booking) defines the six customer notifications. |

### Open items (do not block v1)

| Item | Note |
|---|---|
| Production host | Build and test with a configurable app origin and worker URL. Choose the Next.js host before production rollout and point Supabase Cron at it. |
| Launch catalog and imagery | Use bilingual fixtures in development and CI. WANAS supplies approved decor and catering options, translations, and imagery before launch, including decor examples for the homepage. Keep fixture options out of production. |
| Dedicated ADRs | The technical design supplies the implementation rules. Whether to record separate ADRs for date reservations, the Next.js authorization boundary, and immutable request and quote history is a documentation decision. |

---

## 0. Conventions

### Migrations and data

- Keep Drizzle definitions in `lib/server/db/schema.ts`. Commit generated migrations under `drizzle/`. Apply them to a fresh Postgres database in CI and once per production release before the app deploys.
- Use Postgres `date` for Cairo event dates and timezone-aware timestamps for instants. Calculate calendar boundaries in `Africa/Cairo`. Sample the database clock after acquiring mutation locks. A hold is live only while the sampled instant is earlier than its expiry.
- Persist one reservation per date with a primary key on `date_reservations.date`. A reservation represents either a quote hold with its expiry or a confirmed booking. Serialize competing date operations even when the reservation row does not yet exist. Acquire locks in a consistent order when a write touches multiple dates.
- Use a unique key on `event_requests(customer_id, submission_id)` and a unique accepted quote reference on bookings. Keep quote terms, original request fields, and submitted catalog labels intact when transition fields change. Keep booking revisions and their recorded agreements separate from the accepted quote.

### Proposed code layout

```text
app/
  route.ts
  [locale]/
    layout.tsx
    page.tsx
    plan/page.tsx
    sign-in/page.tsx
    requests/page.tsx
    requests/[requestId]/page.tsx
    admin/inbox/page.tsx
    admin/requests/[requestId]/page.tsx
    admin/calendar/page.tsx
  actions/
  api/availability/route.ts
  api/internal/notifications/route.ts
lib/
  catalog/
  i18n/
  server/
    auth/
    db/schema.ts
    requests/
    quotes/
    bookings/
    reservations/
    notifications/
scripts/set-admin.ts
drizzle.config.ts
drizzle/
tests/integration/
tests/e2e/
```

Replace the root page with a redirect handler that reads the saved locale and defaults to `/ar`. Move the root document into `app/[locale]/layout.tsx` so it owns `<html lang dir>` for `/ar` and `/en`. Business reads and writes go through the server modules. Availability returns only dates and their availability for a validated month.

### Configuration and errors

| Proposed key | Use |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser email-code sign-in and server session verification. |
| `DATABASE_URL` | Server-only Postgres connection. Supply migration and test credentials through their execution environments. |
| `APP_ORIGIN` | App origin for localized request links in email. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFICATION_CRON_SECRET` | Server-only email delivery and worker authentication. |

Return localized validation and state errors for booked dates, expired or superseded quotes, cutoff failures, and stale booking revisions. Render a sign-in path for unauthenticated visitors and deny unauthorized records without exposing their contents.

---

## 1. Application and database foundations

**Goal:** Establish the bilingual shell, verified access checks, and Postgres schema for later phases. No new user-facing behaviour in production.

### 1.1 Locale and identity

Validate `ar` and `en` in the localized layout. Add a language switch that preserves the current route and remembers the selection for `/`. Set up Supabase email-code sign-in and verified server sessions. Add server-only customer ownership and admin checks for pages and actions. Give the trusted operator a restricted grant and revoke command keyed by Supabase user ID. Keep `is_admin` in a server-managed record.

### 1.2 Schema, time, and transactions

Add the tables for event requests, quotes, bookings, booking change requests, booking revisions, date reservations, admin access, and the notification outbox. Add database constraints for request deduplication and reservation capacity. Centralize Cairo date arithmetic, the lock order, and the after-lock database clock read. Set up a test Postgres database and run migration checks in CI.

**Acceptance**

- A fresh test database applies all migrations. Attempts to insert duplicate reservation dates or duplicate customer submission IDs fail.
- The localized shell sets Arabic RTL and English LTR. The root honors a saved preference and defaults to Arabic.
- Server entry points reject missing identity, cross-customer access, and admin access without `is_admin`. Revocation takes effect on the next protected operation.

---

## 2. Customer planner and submission

**Goal:** A guest completes the full planner and submits one request after signing in.

### 2.1 Homepage, planner, and final review

Replace the starter homepage with decor examples and **Plan your event**. Collect event type, estimated guest count, date, venue name, street address, venue type, and one EGP budget range for decor and any requested catering.

- Event types are Wedding, Katb al-kitab, Engagement, Birthday, Anniversary, Private dinner, Corporate event, and Other. Venue types are Apartment, Villa, Garden, Hall, Hotel, and Other. Each Other selection requires a description.
- **Let WANAS choose the decor** lets WANAS select the decor. **Customize my decor** offers a moodboard, palette, backdrop, florals, and table styling, with individual choices delegable to WANAS. Both modes accept optional notes and inspiration links.
- Optional catering in either mode offers canapés, buffet, plated dining, or a WANAS recommendation from the fixed launch catalog. Use the Stitch exports for layout. Use the product scope for planner behavior and EGP budget input. Venue sourcing is deferred.
- Fetch live availability for the visible month. Show held dates as selectable and booked dates as disabled. Final review collects the customer's name and mobile number. Keep the draft and submission ID in the tab's `sessionStorage` through refresh, locale switches, and email-code sign-in. Return to completed review for explicit submission.

### 2.2 `submitRequest(draft, submissionId)`

1. Verify the customer and begin a transaction. Serialize writes for that customer and submission ID, then return any existing request before date or catalog checks that may have changed since submission.
2. For a new request, validate all fields against the shared catalog. Acquire the requested date lock and read the database clock. Require at least 10 Cairo calendar days' notice and reject a booked date.
3. Insert the immutable request snapshot with the locale, contact details, and catalog choices as shown at submission. Resolve a uniqueness conflict by returning the existing request.
4. Enqueue the submission email only for a new request. After the transaction succeeds, clear the draft and open the request.

**Acceptance**

- Both decor modes can submit with or without catering. Missing required fields and unrecognized catalog options are rejected.
- At exactly 10 Cairo calendar days a request can be submitted. At nine days it fails. A hold permits submission. A booking made after calendar load causes submission to fail.
- Refresh and sign-in retain the draft and return to review. A successful retry, including a concurrent retry, yields one immutable request and one submission outbox job.

---

## 3. Admin request review and first quote

**Goal:** An invited admin reviews a request, declines it or sends its first quote, and reserves the offered date.

### 3.1 Admin inbox and operations

Show actionable requests and their original details. Keep supplier checks internal. Display the request language for custom quote notes. For an alternate date, WANAS discusses it with the customer before sending the offer.

`sendQuote(requestId, { offeredDate, services, totalEgp, scopeExplanation })`

1. Verify the admin, start a transaction, and lock the request and offered date. Check that the request can receive a quote. Read the database clock.
2. Require 10 calendar days' notice for a different offered date. For the original date inside that window, require the full 48-hour hold to expire strictly before the start of the Cairo event day.
3. Claim the offered date or reclaim an expired hold. Reject a booking or a live hold belonging to another quote. Insert the quote as current with the offered terms and its own expiry.
4. Enqueue the quote-ready email and commit the quote and reservation together.

`declineRequest(requestId)`

1. Verify the admin and lock the request and any current hold in one transaction. Check that the request can still be declined.
2. Close the request, release its hold if present, and enqueue the WANAS-declined email.

**Acceptance**

- The request details and quote show the original scope, quoted services, EGP total, offered date, and explanation of any scope changes.
- Two concurrent quotes for the same date produce one hold and one quote-ready job. A rejected quote leaves no quote or outbox job.
- An alternate date at nine days is rejected. An original-date quote whose hold ends at or after Cairo midnight starting the event day is rejected inside the 10-day window.
- Declining an actionable request closes it and creates one localized decline job. A booked request cannot be declined through the inbox.

---

## 4. Customer quote acceptance and confirmed calendar

**Goal:** The customer accepts a live quote from My requests and the admin sees the confirmed booking and competing requests.

### 4.1 My requests and acceptance

Add a signed-in list and detail page for each customer's requests. Show quote history, bookings, and change requests as each phase is implemented. Preserve the intended localized request link through sign-in.

`acceptQuote(requestId, quoteId)`

1. Verify customer ownership. In one transaction, lock the request, quote, and offered date. Read the database clock.
2. Return the existing booking for a replay of its accepted quote. For a new acceptance, verify the quote is current, awaits a response, and owns the live hold for its offered date.
3. Insert the booking referencing that quote and convert the hold to the booking reservation. Record the acceptance and enqueue the booking-confirmed email.

### 4.2 Admin calendar and competing requests

Open the month calendar with confirmed bookings by default. Add an optional pending-request overlay and links to entry details. Show **Date unavailable** in the admin inbox for competing requests whose requested date becomes booked. Permit follow-up with an alternative offer or closure through the existing quote and decline operations.

**Acceptance**

- Quote acceptance produces one booking on the offered date, one booking reservation, and one confirmation job. No payment step is required.
- The action rejects another customer's quote and an expired quote, including expiry while waiting for a lock. A double click cannot duplicate the booking or job.
- The calendar opens with the confirmed booking and shows pending requests only when toggled. Competing requests for the booked date are flagged.
- The initial end-to-end milestone uses the full planner and Phase 5 to deliver a quote to a test mailbox before accepting it through its signed-in link.

---

## 5. Localized notification delivery

**Goal:** Deliver queued customer email and show admin failures that need attention. This phase can begin after the outbox migration is ready.

### 5.1 Cron worker and templates

Expose a secret-protected `POST /api/internal/notifications` for Supabase Cron to call every five minutes. Add Arabic and English templates for submission, quote ready, WANAS request decline, booking confirmation, cancellation, and rescheduling. Build quote links from `APP_ORIGIN` and the request's saved language.

1. Claim due outbox jobs in a short transaction with exclusive, recoverable claims so overlapping runs do not process the same job at once.
2. Before each quote email attempt, re-read the current quote, response state, and hold against the current database time. Record obsolete jobs as skipped.
3. Send through Resend with the same idempotency key on every attempt for a job. Record delivery or schedule the next retry after 5 minutes, 15 minutes, 1 hour, or 4 hours for a transient failure.
4. Mark permanent failures and exhausted retries for the admin inbox. Log the job ID and provider error code. Keep email bodies out of logs.

**Acceptance**

- An unauthorized worker call is rejected. Concurrent authorized calls do not send duplicate emails for one job, including after recovery from an interrupted attempt.
- A quote email uses the request's saved language and opens the signed-in request. An expired, replaced, declined, or accepted quote is skipped when found obsolete before a send.
- Transient failure schedules the configured delays with a stable idempotency key. Permanent or exhausted failure appears in the admin inbox, with no email body in logs.

---

## 6. Quote lifecycle and request withdrawal

**Goal:** Customers can decline a quote or withdraw an unbooked request, and admins can replace or resend offers with a fresh hold.

### 6.1 Decline, expiry, and withdrawal

`declineQuote(requestId, quoteId)` and `withdrawRequest(requestId)`

1. Verify ownership. In one transaction, lock the request and any applicable quote and reservation. Read the database clock.
2. Decline only a current quote awaiting a response with a live hold. Withdraw only an unbooked request that is still open. Record the outcome and release any hold still owned by the affected quote.

Derive effective expiry from the hold timestamp for customer and admin reads. Reclaim expired holds when a later transaction needs the date. Retain the history of the expired quote. Customers can contact WANAS directly to discuss unbooked request changes.

### 6.2 Replacement and resend

`sendQuote(requestId, offer)` for an existing quote

1. Verify the admin and lock the request, current quote, and affected dates in one transaction. Read the database clock and apply the same offered-date rules as for the first quote.
2. Secure the candidate hold for a new quote. A replacement on the same date can transfer the current quote's hold within this transaction. If the new date cannot be secured, roll back the attempt.
3. Make the new quote current, release any previous hold it replaces, and enqueue a quote-ready job. Keep the old quote terms in history.

**Acceptance**

- Declining or withdrawing releases the associated hold. Withdrawing a booked request is rejected. At expiry a hold is reclaimable and its quote cannot be accepted.
- Replacement and resend create a new quote and give it a fresh 48-hour hold. Accepting a superseded quote is rejected.
- A replacement that cannot reserve the new date leaves the previous quote and hold intact. Pending obsolete quote email is skipped.

---

## 7. Booking changes, cancellation, and rescheduling

**Goal:** WANAS records agreed changes to a confirmed booking, including any price adjustment, and keeps capacity correct.

### 7.1 Customer change requests

`requestBookingChange(bookingId, seenRevision, change)`

1. Verify the customer owns the booking. In one transaction, lock the booking and read the database clock. Check that it is confirmed and the submission is through the end of the Cairo day 10 days before the booked date.
2. Record the change, cancellation, or reschedule request with the revision the customer saw. Keep it pending for admin review.

### 7.2 Admin review and application

`applyBookingChange(changeRequestId, reviewedRevision, agreement)`

1. Verify the admin and lock the pending change, booking, and relevant dates in one transaction. Read the database clock and check the current booking cutoff. If the booking advanced, require explicit review against its current revision before applying the agreement. Reject a review that became stale again.
2. For a reschedule, require 10 calendar days' notice for the new date. Claim the available destination before releasing the original date. For cancellation, release the original date. For a scope change, update the agreed booking details.
3. Record the agreement and any price adjustment, advance the booking revision, and close the applied change request. Keep the accepted quote as the original agreement. Enqueue email for cancellation or rescheduling.
4. Refresh the calendar and inbox availability from the committed booking and reservation state.

**Acceptance**

- Customer submission and admin application are allowed through the cutoff day and rejected at the next Cairo midnight. A move inside the destination notice period fails.
- A stale review cannot write. Review against the current revision permits an agreed change within the cutoff and increments the revision once.
- Canceling frees the original date. In a destination race, one reschedule wins and the other booking keeps its original date. Failed updates create no outcome email.

---

## 8. Tests and production rollout

**Goal:** Prove the full flow and the concurrency rules on Postgres, then release with production configuration and reversible app deployment.

### 8.1 CI and staging

- Run fresh-database migrations and integration tests for duplicate submissions, concurrent holds for one date, accept versus expiry or replacement, and competing reschedules. Use separate transactions and test Cairo midnight, the 10-day cutoffs, and the distinction between a calendar day and 48 elapsed hours.
- Run browser tests from guest planning through signed-in review, quote email, acceptance, and the admin calendar. Exercise both languages and both decor modes. Test cross-account access, admin revocation, and the public availability response.
- Run worker tests for stable idempotency, exact retry intervals, stale quote suppression, and admin failure reporting. Verify all six localized email events, including the change outcomes.

### 8.2 Production release

1. Configure the chosen app host, production Supabase project and email-code sign-in, server credentials, and verified Resend sender. Load the approved bilingual catalog and images.
2. Apply the production migrations once before app deploy. Keep changes compatible with the previous app version so an app rollback preserves customer data. Stage breaking changes across releases.
3. Deploy the app, grant the invited admin their role with the operator command, and configure Supabase Cron to call the worker every five minutes with its secret.
4. Smoke-test localized request links, a submission and quote email in the intended language, booking acceptance, the admin calendar, and the cron run.

**Acceptance**

- CI can build from an empty database and passes the documented authorization, date, concurrency, and email cases.
- Staging proves submission through booking confirmation with a delivered quote email from the full planner.
- Production serves the approved catalog, the intended admin can access the calendar, and the scheduled worker reaches its authenticated endpoint. The deployed schema still supports the prior app version during rollback.

---

## Phase dependencies

```text
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──┐
       └──────────────────────────▶ Phase 5 ──┤
                                             ▼
                             First end-to-end milestone
                                             │
                                             ▼
                             Phase 6 ──▶ Phase 7 ──▶ Phase 8

Phase 5 can start once Phase 1 is complete. Integrate it with the quote jobs
and admin inbox from Phase 3. The milestone requires Phases 4 and 5.
```
