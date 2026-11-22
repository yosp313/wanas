# WANAS v1 technical design

WANAS runs the planner, customer dashboard, and admin tools in one Next.js app. Supabase hosts Postgres. The application originally used Supabase Auth, then moved to Clerk. See the [Clerk migration plan](clerk-auth-implementation-plan.md) for the sign-in and identity design. Drizzle owns schema definitions, migrations, and database access. A quote acceptance confirms a booking in one transaction, with Postgres enforcing capacity for each Cairo calendar date. [Product scope](v1-product-scope.md) · [Booking capacity ADR](adr/0004-enforce-booking-capacity-in-postgres.md)

## Application and access

- Next.js handles all business data access. Server Actions call server-only TypeScript functions that validate input, check permissions, and run Drizzle transactions. The browser uses Clerk for sign-in. The Supabase Data API stays outside the application path.
- The server maps the verified Clerk user ID to an application UUID and uses it to check request ownership. Every admin action checks `is_admin` against the UUID. Staff sign in through Clerk. A trusted operator grants and revokes admin access with a restricted command. [Account and staff access ADR](adr/0002-require-an-account-at-submission.md)

## Planner and localization

- The first end-to-end build includes the full planner, both decor modes, optional catering, and final review. Use the Stitch exports for layout and the product scope for fields and choices. [Stitch exports](../stitch-exports/) · [Planner scope](v1-product-scope.md#customer-planner)
- Store the guest draft in the planner tab's `sessionStorage`. Keep it through refreshes and sign-in, return the customer to the completed review, and clear it after submission succeeds.
- Assign each draft a stable submission ID. Postgres enforces uniqueness per customer and submission ID. A retry returns the existing request and leaves its original notification job in place.
- Keep the approved catalog in the repo with stable option IDs and Arabic and English labels. Share the catalog between the planner and server validation.
- Use `/ar` and `/en` for locale-specific pages. The root opens the saved preference and defaults to Arabic. Switching languages opens the equivalent page. Set the page direction for each locale. Save the chosen language on each request and use it for related emails and as guidance for admins writing quote notes. [Language ADR](adr/0003-launch-in-english-and-arabic.md)

## Requests, quotes, and bookings

- Keep the original submitted request as an immutable snapshot, including catalog selections as they appeared at submission. Each quote keeps its own offered date, included services, total in EGP, and any explanation of scope changes. A replacement creates a new quote record. Only the current quote can be accepted.
- A booking references the accepted quote. Record later changes and agreed price adjustments separately. Each booking change request records the revision the customer saw. Applying a change advances the booking revision. An admin must review a pending change against the current booking before applying it if the revision has advanced.
- The admin inbox flags competing requests when a date becomes booked. The admin month calendar opens with confirmed bookings and can also show pending requests. [Quote and booking ADR](adr/0001-confirm-bookings-by-quote-acceptance.md) · [Review and booking scope](v1-product-scope.md#review-and-booking)

## Date reservations

A `date_reservations` table keyed by Cairo calendar date enforces one active hold or confirmed booking per date. Sending a quote claims the offered date. Acceptance verifies ownership, that the quote is current, and that the hold is active, then converts the reservation to a booking. Each action updates its records and reservation in the same Drizzle transaction.

- Quote decline releases the hold. A later transaction can reclaim an expired hold on demand. Replacing a quote requires securing the new quote's hold in the same transaction. If that attempt fails, the previous quote and its hold stay in place.
- Cancellation releases the booking's date. Rescheduling claims the available new date and releases the original date in one transaction.
- Store event dates as calendar dates and timestamps as UTC instants. Calculate calendar rules in `Africa/Cairo`. Booking mutations read the database clock after acquiring their locks. A hold lasts 48 elapsed hours.
- Require 10 calendar days' notice for submission, an offer for a different date, and a reschedule to a new date. A quote for the original date may go out inside that window if its entire hold ends before the event day starts in Cairo. Both the customer change request and the admin action must occur by the end of the Cairo calendar day 10 days before the booking. [Quote and booking ADR](adr/0001-confirm-bookings-by-quote-acceptance.md)
- Read live public availability for the visible month. Return dates and availability only. Held dates remain selectable, and booked dates are unavailable. Check availability again when the customer submits.

## Email delivery

Write each notification to the Postgres outbox in the transaction that changes the request, quote, or booking. Send email after submission, when a quote is ready, when WANAS declines a request, and when a booking is confirmed, cancelled, or rescheduled. Quote emails link to the signed-in request page in the request's language. [Notification scope](v1-product-scope.md#review-and-booking)

Supabase Cron calls a secret-protected Next.js endpoint every five minutes. The worker sends due jobs through Resend. Before each quote email attempt, check that the quote is current, still awaits a response, and has an active hold. Mark obsolete jobs as skipped.

Retry transient failures after 5 minutes, 15 minutes, 1 hour, and 4 hours, using the same Resend idempotency key on each attempt. Show permanent failures and exhausted retries in the admin inbox. Log the job ID and provider error code for troubleshooting and keep email bodies out of logs.

## Build and release

1. Set up sign-in, Drizzle migrations, bilingual routes, and a Postgres test database.
2. Prove the full flow with the complete planner. Submit as a signed-in customer, send a quote as an admin, deliver it to a test mailbox, accept it, and verify that the confirmed booking appears in the admin calendar.
3. Complete quote replacement, expiry, and decline, then booking changes, cancellations, and rescheduling. Verify email retries and that obsolete quotes are skipped.

CI applies migrations to a fresh Postgres database. Test concurrent quotes for the same date, acceptance after expiry, and a reschedule race for the destination date. Run production migrations once per release before deploying the app. Keep them compatible with the previous app version so an app rollback can preserve customer data. Stage breaking changes across releases.

## Open items

- Choose the production host for the Next.js app and worker. Supabase Cron calls the worker wherever the app runs.
- Supply the approved decor options, translations, and assets for the launch catalog.

The date reservation model, the Next.js authorization boundary, and the immutable request and quote history are candidates for dedicated ADRs.
