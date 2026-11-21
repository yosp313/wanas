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
| Staging | A dedicated Supabase project, Clerk development instance, test Resend sender, and a controlled inbox | Delivered magic links, Google sign-in, and imported account checks |
| Production | The approved host, Clerk production instance, production Supabase project, and verified Resend sender | Release smoke checks and scheduled worker |

The local database must be disposable. The current Phase 8 database is
`postgres://wanas:wanas_local@127.0.0.1:55432/wanas_phase8`. Tests must fail when
`DATABASE_URL` points at a non-local host unless an explicit staging or
production command is being run.

Browser tests use Clerk development credentials, disposable test users, and a local notification capture. Staging uses a controlled inbox to verify real email delivery and an approved Google account to verify OAuth.

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

Each full-flow test provisions disposable users in the designated Clerk development instance and signs them in with Clerk's Playwright helper. The helper creates a session through a test ticket. Use a separate staging check for real provider flows.

The primary scenario is:

1. Open the planner as a guest in `/ar`, switch to `/en`, and confirm that the
   equivalent draft survives the language change and a refresh.
2. Exercise both decor modes, optional catering, the `Other` descriptions,
   budget, venue, date, notes, and inspiration link fields.
3. Sign in and resume the saved review, then submit it. Verify the request page, ownership, and
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

## Run the browser flow locally

Use disposable local Postgres and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for an approved development instance.

For GitHub Actions, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as a repository variable and `CLERK_SECRET_KEY` as a repository secret. When either value is unavailable, CI still runs the build, lint, and Postgres tests and skips browser smoke tests.

1. Set `DATABASE_URL` to the disposable WANAS database and run `npm run db:migrate`.
2. Start the loopback mail capture with `node tests/fixtures/mail-capture.mjs`.
3. Start the Next.js development server on loopback. Set
   `NEXT_PUBLIC_WANAS_CATALOG_MODE=fixtures` and
   `NOTIFICATION_TEST_TRANSPORT=loopback` for this run. Set
   `NOTIFICATION_TEST_URL=http://127.0.0.1:3109/emails`,
   `APP_ORIGIN`, `EMAIL_FROM`, a dummy `RESEND_API_KEY`, and a local
   `NOTIFICATION_CRON_SECRET`. Use the same origin for the browser test.
4. Set `E2E_FULL_FLOW=1`, `PLAYWRIGHT_BASE_URL`, `DATABASE_URL`,
   `NOTIFICATION_TEST_URL`, `NOTIFICATION_CRON_SECRET`, and the Clerk development keys
   for the test process. Run
   `npm run test:e2e -- --workers=1`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
   if you want to use an installed Chromium executable.

The browser suite submits an English curated request and an Arabic custom
request. It signs in with Clerk, opens a quote from the local delivery
capture, confirms the booking, checks the calendar, reschedules the booking,
and verifies admin revocation. Hosted staging uses the live Resend integration
with a test sender. The loopback delivery transport is unavailable in production.

## Staging checklist

1. Select and record the approved host, Supabase project, sender domain,
   catalog revision, and deployment identifier. Stop if any value is missing.
2. Build once from the release commit. Run migrations against a fresh staging
   database and record the migration version.
3. Load the approved bilingual catalog and images. Confirm that option IDs and
   labels match the committed catalog manifest.
4. Configure server-only secrets: database URL, Clerk secret key,
   Resend key and sender, worker secret, and the stable Next.js server action
   encryption key when more than one app instance runs. Set the Clerk publishable key before building and keep server secrets out of the browser bundle and logs.
5. Rehearse the Clerk import and reconcile the account and ownership counts. Verify that a new and a returning customer can open a delivered magic link in a second tab and resume the original review. Verify Google completion, cancellation, and sign-in through both methods for an imported account. Confirm the mapped UUID and check staff revocation during an active session.
6. Deploy the app and run the browser flow above. Confirm the worker endpoint rejects missing or wrong secrets, then run it with the configured secret.
7. Verify an Arabic and an English quote email, booking acceptance, the admin
   calendar, availability, and a worker retry in the test mailbox.
8. Record build ID, deployment ID, migration version, catalog revision, smoke
   results, and rollback target.

Next.js reads server environment values at request time for dynamic App Router
routes. Public values must use the `NEXT_PUBLIC_` prefix and are embedded at
build time, so secrets must never use that prefix. With multiple instances,
configure a stable deployment ID and server action encryption key. If the app
uses a shared cache, configure a shared cache handler before scaling beyond a
single instance.

## Production release and rollback

Before release, confirm the owned domain, production host, Clerk and Supabase instances, sender, initial staff identities, catalog, and credentials. Follow the Clerk migration plan for production OAuth and domain setup.

1. Freeze the release commit and record its build, migration, and catalog
   revisions.
2. Back up the production database according to the chosen host's procedure.
3. Apply the additive migration and rehearse the mapping against staging. Pause production registrations, business writes, and staff grants for the cutover. Reconcile the final Supabase account changes before deploying Clerk.
4. Deploy the Clerk build with production keys. Grant staff access with `npm run admin:access -- grant <clerk-user-id> <operator-uuid>` and verify the existing Supabase Cron call using its Vault secret.
5. Verify localized redirects, imported owner and staff access, and quote deep links before reopening writes and registrations. Check the worker rejects an unauthorized call with 401.

Before reopening writes, roll back a failed cutover by redeploying the previous build with its Supabase Auth environment. Leave the identity migration in place and verify the previous build reads the same business data. After reopening writes, repair forward unless the rollback preserves Clerk-only accounts and their data. Record the staging rollback rehearsal before releasing.

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
