# Phase 8 release and testing runbook

This runbook describes the checks required before the WANAS v1 release. It is
deliberately independent of a hosting provider, a production Supabase project,
and an approved launch catalog. Do not put real credentials, a production URL,
or customer data in the repository.

## Test environments

Use three environments with the same application build and migration set:

| Environment | Database and services | Purpose |
| --- | --- | --- |
| Unit and integration | Disposable PostgreSQL 16 on localhost | Transactions, authorization, dates, outbox, and worker behavior |
| Staging | A dedicated Supabase project, a test Resend sender, and Mailpit or another test mailbox | Full browser flow with real email-code authentication where available |
| Production | The approved host, production Supabase project, and verified Resend sender | Release smoke checks and scheduled worker |

The local database must be disposable. The current Phase 8 database is
`postgres://wanas:wanas_local@127.0.0.1:55432/wanas_phase8`. Tests must fail when
`DATABASE_URL` points at a non-local host unless an explicit staging or
production command is being run.

Keep service access behind small adapters. Integration tests can use the real
Supabase Auth and Mailpit services when they are running. A deterministic test
Auth adapter and an in-memory or HTTP mail adapter may be used when those
services are unavailable. The adapter must expose the same operations as the
real service, and the test must record which adapter ran. Do not mix real Auth
with a fake database or fake email in one result without naming that boundary.

## Fixture-independent test harness

Every test creates its own namespace and data. Do not depend on rows left by a
previous test or on a global seed with fixed primary keys.

1. Open a database connection and start a transaction for each test.
2. Create a unique test run ID and derive customer and admin identities from
   it. Use an explicit `test+<run-id>@example.invalid` address.
3. Apply migrations to a fresh database for the migration suite. For the test
   suite, use a transaction or a run-owned cleanup scope.
4. Create catalog rows through the same catalog loader used by the app. The
   test catalog must use stable option IDs, both locale labels, and no real
   image URLs.
5. Pass a `Clock` or database-clock seam into date-sensitive services. Tests
   set an instant and the application converts it with `Africa/Cairo`.
6. Roll back the transaction or delete only the run-owned rows in teardown.
   Teardown must run after a failed test and must report failures.
7. Capture outbox rows and worker attempts by job ID. Assertions must not rely
   on email ordering or provider-generated IDs.

The harness should provide builders for a customer, an invited admin, a
request, a quote, a reservation, and a booking. Builders should return IDs and
the submitted revision, rather than exposing table internals to every test.
The concurrency helpers must use separate connections and a barrier so that
both transactions reach the intended lock or unique constraint before either
continues.

### Required integration cases

- Duplicate submission with one customer and one submission ID creates one
  request and one submission notification job. A retry returns the existing
  request.
- Two quote transactions targeting one Cairo date result in one active hold.
  The losing transaction leaves no quote, reservation, or outcome email.
- Acceptance succeeds only for the current quote, its customer, and its active
  48-hour hold. Expired, replaced, declined, and cross-account quotes fail.
- Acceptance and expiry do not both confirm a booking. The confirmed booking
  owns the reservation after the winning transaction commits.
- Two reschedules targeting one destination date result in one applied change.
  The loser keeps the original booking date and creates no outcome email.
- A stale change request cannot write. A request reviewed against the current
  revision applies once and increments the revision once.
- Cancellation releases the original date. A later quote can claim it.
- Customer and admin authorization tests cover request ownership, admin role
  revocation, and the authenticated worker endpoint.

### Required time cases

Use fixed instants around Cairo midnight, daylight-saving rule changes if the
library supports them, and the exact boundaries below:

- submission, a different-date quote, and reschedule are accepted through the
  end of the Cairo calendar day 10 days before the event;
- the same operations fail at the next Cairo midnight;
- a quote for the original requested date may be sent inside the notice window
  only when its complete 48-hour hold ends before the event day starts;
- hold expiry compares elapsed time, while notice checks compare Cairo calendar
  dates. A 48-hour hold is not a substitute for a two-calendar-day rule.

## Worker and email tests

Run the worker against a controlled clock and a fake provider that records the
idempotency key, attempt number, and provider result. Verify the following:

- due jobs are claimed once when two workers race;
- retries occur after 5 minutes, 15 minutes, 1 hour, and 4 hours;
- each retry uses the same Resend idempotency key;
- a non-current quote, a declined request, an expired hold, or a completed
  booking marks a quote email skipped without calling the provider;
- permanent failures and exhausted retries appear in the admin inbox;
- message bodies and credentials never appear in logs;
- all six localized events are rendered in Arabic and English: submission,
  quote ready, request declined, booking confirmed, booking cancelled, and
  booking rescheduled.

The staging run should replace the fake provider with Mailpit or the approved
test mailbox. Assert the recipient, locale, signed request link, subject, and
the absence of secrets. Do not assert provider-specific message IDs.

## Browser E2E approach

Use Playwright against a production build started with `next start`, as
recommended by the Next.js testing guide. Keep the base URL configurable and
never hard-code a production host. The browser project should run the same
flow in Chromium for pull requests, then all supported browsers in staging.

Each E2E test creates a run-owned customer and admin account through the test
service adapter. The test signs in with an email code captured from Mailpit or
the Auth adapter, rather than using a shared account. A test-only setup route
or server-side helper may issue identities, but it must be disabled unless a
test environment flag is set and must reject non-local origins.

The primary scenario is:

1. Open the planner as a guest in `/ar`, switch to `/en`, and confirm that the
   equivalent draft survives the language change and a refresh.
2. Exercise both decor modes, optional catering, the `Other` descriptions,
   budget, venue, date, notes, and inspiration link fields.
3. Submit after email-code sign-in. Verify the request page, ownership, and
   submission email in the selected language.
4. Sign in as the invited admin, open the request, send a quote, and verify the
   quote email link and total.
5. Return as the customer, accept the current quote, and verify the confirmed
   booking and the admin calendar entry.
6. Request a change, have the admin apply it, then verify the localized change
   outcome and the updated calendar date.

Separate scenarios cover decline, quote replacement, hold expiry, cancellation,
rescheduling, competing requests, cross-account access, revoked admin access,
and the public month availability response. Assertions should use accessible
roles and labels, not generated CSS class names. Capture a trace and screenshot
on failure. Clean up by run ID even when a test fails.

## Staging checklist

1. Select and record the approved host, Supabase project, sender domain,
   catalog revision, and deployment identifier. Stop if any value is missing.
2. Build once from the release commit. Run migrations against a fresh staging
   database and record the migration version.
3. Load the approved bilingual catalog and images. Confirm that option IDs and
   labels match the committed catalog manifest.
4. Configure server-only secrets: database URL, Supabase server credentials,
   Resend key and sender, worker secret, and the stable Next.js server action
   encryption key when more than one app instance runs. Keep these out of the
   browser bundle and logs.
5. Deploy the app and run the browser flow above. Confirm the worker endpoint
   rejects missing or wrong secrets, then run it with the configured secret.
6. Verify an Arabic and an English quote email, booking acceptance, the admin
   calendar, availability, and a worker retry in the test mailbox.
7. Record build ID, deployment ID, migration version, catalog revision, smoke
   results, and rollback target.

Next.js reads server environment values at request time for dynamic App Router
routes. Public values must use the `NEXT_PUBLIC_` prefix and are embedded at
build time, so secrets must never use that prefix. With multiple instances,
configure a stable deployment ID and server action encryption key. If the app
uses a shared cache, configure a shared cache handler before scaling beyond a
single instance.

## Production release and rollback

Production release is blocked until the host, Supabase project, sender, admin
identity, approved catalog, and credentials have been supplied and verified by
the operator.

1. Freeze the release commit and record its build, migration, and catalog
   revisions.
2. Back up the production database according to the chosen host's procedure.
3. Apply migrations once, before the app deploy. Check that each migration is
   compatible with the previous app version.
4. Deploy the built app, grant the invited admin role with the restricted
   operator command, and configure Supabase Cron to call the secret-protected
   worker every five minutes.
5. Run smoke checks for both locale links, one submission, one quote email,
   acceptance, the admin calendar, public availability, and one authenticated
   cron call. Use a controlled test request and delete or cancel it according
   to the production data policy.

If smoke checks fail, stop new traffic if the host supports it, preserve logs
and the deployment record, and roll back the app to the previous build. Do not
roll back migrations blindly. First verify that the previous build can read
the new schema and that no destructive migration ran. If compatibility is not
proven, restore through the approved database recovery procedure and involve
the operator. After rollback, re-run the worker authentication and read-only
calendar checks.

## Evidence and exit criteria

Attach these artifacts to the release record:

- fresh-database migration output and integration test report;
- Playwright report, traces for failures, and staging mailbox evidence;
- worker retry and stale-quote results;
- catalog manifest and image revision;
- build, deployment, migration, and rollback identifiers;
- the operator's host, Supabase, sender, and cron verification.

The phase is complete only when CI builds from an empty database, staging
proves submission through booking confirmation with a delivered quote email,
and production passes the smoke checks without an unknown host or credential.
