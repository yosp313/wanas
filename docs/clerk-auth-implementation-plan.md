# Clerk auth migration plan

Move sign-in and session verification to Clerk. Supabase Postgres continues to host the application tables and notification schedule.

1. A guest completes the planner, signs in by email magic link or with Google, returns to the saved review, and submits the request.
2. An existing customer signs in again and can open the same requests, quotes, and bookings. Requests, quote links, and booking history keep their existing IDs.
3. Invited staff sign in through Clerk. A trusted operator grants and revokes access in Postgres, and revoked staff lose admin access on their next protected request.

## Related code

- Session and access contracts in `getVerifiedUser()`, `requireCustomer()`, `requireAdmin()`, and `withPageAccess()` (`lib/server/auth/identity.ts`, `lib/server/auth/guards.ts`, `lib/server/auth/page-access.ts`).
- Stored ownership and audit IDs in `eventRequests`, `bookingChangeRequests`, `bookingRevisions`, and `adminAccess` (`lib/server/db/schema.ts`).
- Submission and quote email behavior in `submitRequest()` and `acceptQuote()` (`lib/server/requests/submit.ts`, `lib/server/requests/actions.ts`).
- Customer read and write checks in `getCustomerRequest()` and `requestBookingChange()` (`lib/server/requests/queries.ts`, `lib/server/bookings/actions.ts`).
- Staff access and audit behavior in `sendQuote()`, `applyBookingChange()`, and the `grant`/`revoke` branches (`lib/server/admin/actions.ts`, `lib/server/bookings/actions.ts`, `scripts/set-admin.ts`).
- Locale cookie and rendering in `proxy()`, `LocaleLayout()`, and `nextConfig` (`proxy.ts`, `app/[locale]/layout.tsx`, `next.config.ts`).
- Sign-in entry and redirect validation in `SignInPage()`, `SignInForm()`, `safeReturnTo()`, and `LocaleSwitcher()` (`app/[locale]/sign-in/page.tsx`, `app/[locale]/sign-in/sign-in-form.tsx`, `lib/i18n/return-to.ts`, `app/[locale]/locale-switcher.tsx`).
- Draft and submission retry in `Planner()` and `submitRequestAction()` (`components/planner/Planner.tsx`, `app/actions/submit-request.ts`).
- Scheduled notifications in `POST()` (`app/api/internal/notifications/route.ts`).

The app uses Clerk and includes commands to manage staff access and import identity mappings. The staging rehearsal imported one verified email account and preserved its original UUID. The inventory found no existing request owners, staff grants, or historical booking actors. The local rollback smoke check read preserved bookings with the previous Supabase Auth build.

Live magic-link delivery, same-tab planner recovery after opening the link in a second tab, and Google sign-in for the imported account still need confirmation. Production setup and cutover are pending at the owner's request.

---

## End-to-end flow

```text
Guest or returning customer                      Invited staff
  │ Opens a protected page or submits a draft      │ Opens localized admin page
  └───────────────▶ Localized sign-in ◀─────────────┘
                          │ Complete email link or Google OAuth and activate Clerk session
                          │ Validate returnTo and resume requested page
                          │ Resolve Clerk user ID to application UUID
               ┌──────────┴─────────────────┐
               ▼                            ▼
  Review and submit draft            Check active admin_access row
  or open owned request                    │
               │                           ▼
               ▼                     Review requests and manage bookings
  Request, quote, or booking action  Operator grants or revokes in Postgres
```

---

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Provider | **Clerk for authentication.** Use `@clerk/nextjs` for sessions. Keep Drizzle, Supabase Postgres, Supabase Cron, and Resend on their existing paths. | `getVerifiedUser()` verifies the Clerk session and resolves the application UUID. `submitRequest()` writes through Drizzle, and the notification `POST()` authenticates with `NOTIFICATION_CRON_SECRET`. |
| Sign-in methods | **Email magic links and Google OAuth.** Offer both for sign-up and sign-in in the localized shell. | `SignInForm()` already lets new and returning customers start from one page, and `withPageAccess()` sends guests there. |
| Identity | **Keep application UUIDs.** Resolve a verified Clerk subject through a server-only mapping. Seed imported users with their original UUID and allocate a UUID for each new account. | `eventRequests.customerId` scopes ownership and submission retries. `bookingChangeRequests.customerId`, `bookingRevisions.agreedBy`, and `adminAccess` store UUIDs for ownership, audit, and staff access. |
| Authorization | **Keep server-side ownership and role checks.** Preserve `requireCustomer()`, `requireAdmin()`, and `withPageAccess()` as the access boundaries. Check the database for staff privileges on each protected operation. | `getCustomerRequest()` and `requestBookingChange()` scope reads and writes by owner. `sendQuote()` checks `requireAdmin()` before its transaction. `withPageAccess()` redirects guests and returns not found for unauthorized staff pages. |
| Resume | **Keep localized return paths and the draft in its original tab.** Reuse the sign-in shell and validated `returnTo`. | `safeReturnTo()` localizes same-origin destinations, `LocaleSwitcher()` updates them when changing language, and `Planner()` keeps its draft and submission ID in tab-scoped `sessionStorage`. |
| New request email | **Use a verified Clerk email.** Resolve the primary verified email on the server before a new request can be written. | `submitRequest()` snapshots the account email and queues the initial notification in the same transaction. `acceptQuote()` uses the saved request email. |
| Rendering | **Keep Clerk session setup in the Next.js proxy and provider.** Compose it with locale handling and keep protected reads at request time. | `proxy()` writes `w_locale`, `LocaleLayout()` owns document language and direction, and `nextConfig` enables Cache Components. |

## Conventions

### Code layout

```text
drizzle/<next migration>             # Clerk identity table, constraints, and RLS
lib/server/auth/identity.ts          # Clerk subject to application UUID resolution
scripts/import-clerk-identities.ts   # Dry-run and apply verified legacy mappings
app/[locale]/sign-in/verify/page.tsx # Clerk magic-link verification
app/[locale]/sign-in/sso-callback/page.tsx # Clerk Google OAuth completion
```

### Configuration

| Setting | Use |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk instance for the browser and provider. |
| `CLERK_SECRET_KEY` | Server-only key for Clerk verification and account lookups. Use separate Clerk instances for development and production. |
| Clerk development and production settings | Enable email verification links for registration and sign-in, and enable Google as a social connection. Keep same-device and same-browser verification enabled for magic links. |
| `DATABASE_URL`, `APP_ORIGIN`, `NOTIFICATION_CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` | Existing database and notification settings. |

Before changing app code, read the installed Next.js authentication and proxy guides under `node_modules/next/dist/docs/01-app/`. Follow the Clerk guidance for Next.js 16, including request-time auth under Suspense where required by Cache Components. [Clerk App Router quickstart](https://clerk.com/docs/getting-started/quickstart) · [Clerk middleware reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)

---

## 1. Session and identity foundations

Verify Clerk sessions and resolve them to application UUIDs in staging.

### 1.1 Approval and CLI setup

This npm project already uses Supabase Auth. Before running Clerk setup, inspect the dependencies, routes, proxy, and session boundaries. With approved data access, inventory legacy account types and ownership references using counts and verification status. Keep environment files, keys, and claim files private.

Present the setup checklist and wait for an explicit yes. The checklist covers integrating the selected Clerk application, installing Clerk agent skills if absent and approved, and starting the app. Obtain explicit approval for the Supabase Auth migration and its session cutover before running `init` or changing the existing auth integration. The two approvals can be requested together.

1. Have the project owner run `npx -y clerk@latest auth login` in their host terminal. Dashboard sign-in and CLI sign-in are separate.
2. From the project root, run `npx -y clerk@latest init --app app_3MORlb4UgyKDrX1dopSHWdmIDlY`. Let the CLI detect Next.js and npm. Add `--no-skills` if the skills are already available or the owner declines installation. Target the Dashboard-selected app and its development instance.
3. Review the generated changes against `proxy.ts`, the localized root layout, and the existing auth routes. Integrate the generated provider and proxy into those files and use the manual Next.js guide for incomplete setup. If Clerk is already integrated when execution starts, skip `init`. Link or pull missing development keys only for the selected application, and get confirmation before replacing working keys or switching applications.

[Clerk CLI](https://clerk.com/docs/cli) · [Next.js manual setup](https://clerk.com/docs/nextjs/getting-started/quickstart.md?manual=1)

### 1.2 Next.js integration

Compose `clerkMiddleware()` into the existing `proxy.ts` and preserve the `w_locale` cookie and root locale selection. Cover the localized pages and Server Action POSTs that call Clerk. Keep public availability and the internal notification endpoint on their current access paths. Mount `ClerkProvider` inside the localized layout's body. Keep authenticated content request-scoped and under the necessary Suspense boundaries.

Implement the Clerk-backed identity adapter in `lib/server/auth/` and include it in the Phase 2 staging build. Use `auth()` to verify the active session and derive its subject. Fetch the Clerk profile server-side when a caller needs a verified email. Preserve the UUID returned as `id` and supply a verified email to `submitRequest()`. Preserve the existing guest and no-email error contracts. Report provider or database failures separately from missing sessions.

### 1.3 Stable UUID mapping and import

Add `clerk_identities` with a text primary key `clerk_user_id` and a unique, non-null UUID `app_user_id` with a generated default. Enable RLS with server-only access, following the existing business tables.

1. Use the `clerk-migrate` skill if installed and Clerk's supported Supabase migration tooling to export, dry-run, and import accounts. The tool handles Backend API account creation, compatible password hashes where present, and stable `external_id` values. Reconcile those IDs to source UUIDs. Review rejected records, verification state, password compatibility, and destination conflicts. If the inventory finds existing OAuth accounts, check provider support and rehearse Clerk's verified-email linking before cutover. Existing social sign-ins need a supported route back to their original account before production writes reopen. [Clerk Supabase migration guide](https://clerk.com/docs/guides/development/migrating/supabase)
2. In a database transaction, insert each verified Clerk subject and original UUID pair. Treat an exact pair as a replay and reject conflicting pairs. Compare the results with source accounts, request owners, and staff grants. Report historical actor UUIDs whose source account no longer exists and leave those audit values in place.
3. For a new Clerk subject with a verified email, insert a fresh UUID on first access and return the stored UUID, including after a concurrent conflict on the same subject. If a Clerk identity carries a legacy external ID and lacks an imported mapping, fail closed and report it for reconciliation. Use only verified session subjects and server-controlled import data for mapping. Leave verified OAuth account linking to Clerk. Always resolve ownership and grants by the Clerk subject and the stored UUID. [Clerk OAuth account linking](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking)

**Acceptance**

- An imported customer resolves to the original UUID. A repeat import leaves the row count unchanged. A conflicting import aborts without reassigning an existing UUID.
- Concurrent first access for one new subject produces one UUID. An unverified session or an imported subject missing its mapping cannot reach a business write.
- English and Arabic routes keep their locale behavior. `npm run build` passes with Cache Components and the Clerk setup.

---

## 2. Customer sign-in and request access

**Goal:** Customers sign in from the planner or a protected request link and continue in the same locale.

### 2.1 Sign in and resume

Keep the localized `SignInForm()` shell and offer an email magic link and a Continue with Google button. Add a signed-in account control in the localized navigation. Apply the same session and redirect rules for new and returning accounts.

- **Email magic link.** Enable email-link verification in Clerk for registration and sign-in. Use a localized verification page. When a mail client opens a new tab, let the original sign-in tab receive the verification result, activate the session, and resume the planner where its draft lives. Handle expired, failed, and device-mismatch links in Arabic and English, with a way to resend or restart. [Clerk email-link flow](https://clerk.com/docs/nextjs/guides/development/custom-flows/authentication/email-links)
- **Google OAuth.** Start Clerk's Google flow in the original tab and use a localized callback to finish sign-in or sign-up. Handle canceled consent and incomplete sessions. Carry the validated destination through the redirect, and sanitize any return path again before navigation. Resume the planner or protected deep link only after Clerk has an active session. [Clerk OAuth flow](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections)

Replace the old Supabase callback with a localized route that asks users following a stale email link to restart sign-in. Sanitize any return path carried by an old link. Keep existing quote notification links pointed at the protected request page.

### 2.2 Submit and manage requests

Run `submitRequest(draft, submissionId)` using the resolved UUID and verified primary email. Keep the transaction's existing idempotency lookup and outbox write. Preserve ownership predicates for request reads, quote responses, and booking changes. Preserve existing request email snapshots for notifications tied to those requests.

**Acceptance**

- A guest in either locale returns to the same review with the same draft and submission ID. Submitting twice yields one request and one submission notification.
- Both methods resume a protected request deep link. A magic link opened in a second tab resumes a planner draft in the original tab. An expired link or canceled Google sign-in keeps the draft available for retry. External or malformed return paths fall back to the locale root.
- When Clerk links Google to an imported, verified email account, both methods resolve to the same UUID. A different Google account cannot access the imported account's requests or staff grants.
- An imported owner can read and act on their existing request. Another authenticated account cannot read it, accept its quote, or submit a change to its booking.

---

## 3. Staff sign-in and access management

**Goal:** Invited staff use the shared Clerk sign-in while Postgres remains the authority for granting and revoking staff access.

### 3.1 Staff operations and operator command

Use the mapped UUID in `requireAdmin()` and keep both `is_admin = true` and `revoked_at IS NULL` in the check. Keep request and booking actions guarded at their existing server entry points. Update `npm run admin:access -- <grant|revoke> <clerk-user-id> <operator-user-id>` to take a Clerk ID for the target and resolve it to the application UUID. Keep the operator argument as the audit UUID.

1. On grant, validate the target account against Clerk and resolve or create its mapping using the verified-account identity rule.
2. In the same database transaction as any new mapping, upsert the grant, set `is_admin` to true, clear `revoked_at`, and record the operator UUID. On revoke, resolve the existing mapping in Postgres and disable the grant without requiring a live Clerk profile.
3. Report unknown targets and failed writes to the operator. Repeating an operation must leave access in the requested state.

**Acceptance**

- An imported active admin can open the inbox and send a quote. An ordinary customer or revoked admin cannot open the page or perform the action.
- Revocation takes effect on the next protected operation even with an active Clerk session. Regranting restores access and records the operator UUID.
- Staff booking changes continue to record the mapped UUID in `booking_revisions.agreed_by`.

---

## 4. Verification and rollout

**Goal:** Rehearse the migration with existing data and release Clerk with verified ownership, staff access, and notification delivery.

### 4.1 Test the integration

Run `npx -y clerk@latest doctor`, start the app, and verify the localized auth controls. Replace Supabase OTP and `auth.users` setup in `tests/e2e/booking-flow.spec.ts` with Clerk Playwright helpers and an isolated development instance. Use approved test accounts and keep the existing local notification capture. Run separate staging checks for a delivered magic link in a controlled inbox and Google OAuth with an approved Google test account. Clerk test-email aliases suppress link delivery. Cover both first-time and returning accounts, the original-tab planner return, an imported account reached through both methods, and staff revocation. Run `npm run lint`, `npm run build`, `npm run db:check`, `npm test`, and the full Playwright flow. [Clerk test emails](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)

### 4.2 Cut over and retire Supabase Auth

1. When the owner approves production setup and supplies the owned domain, use `npx -y clerk@latest deploy --mode agent --domain <domain>` for the selected app. Follow its `nextAction` and verify completion with `npx -y clerk@latest deploy status --mode agent`. Configure production magic links and Google's production OAuth credentials, register Clerk's redirect URI in Google, publish the consent screen, and test the connection. Add the production keys to the confirmed host using Clerk's host setup instructions. [Clerk Google production setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google) Keep local development keys in place. Apply the additive Drizzle migration. Rehearse the import and reconciliation on staging data. For production, inventory accounts and ownership references, back up the database, and review conflicts before proceeding. If there are no existing accounts or ownership references, record the empty inventory and skip the account import.
2. During the cutover window, pause new registrations, business writes, and staff grants. Import and reconcile any final Supabase account changes, then deploy the Clerk build. Verify the imported customer and staff identities, localized redirects, and the scheduled notification endpoint before reopening writes and registrations. Existing users authenticate again with Clerk, including anyone following a pending Supabase magic link.
3. If checks fail before reopening writes, redeploy the previous build using retained Supabase Auth settings and leave the additive mapping in place. After reopening writes, repair forward unless a fallback preserves access for Clerk-only customers and any records they created.
4. After validation, remove the Supabase Auth clients, packages, environment variables, and active callback exchange. Update the README, environment example, and release checklist to document Clerk and the revised operator command. Update the access ADR and product scope to reflect magic links and Google OAuth. Retain the Supabase database, RLS, Vault, and notification schedule.

**Acceptance**

- The rehearsal accounts for every existing customer and active staff grant. An unresolved owner, duplicate mapping, or failed imported-account sign-in blocks opening production writes.
- The rollback rehearsal restores the previous build while preserving business data.
- The full flow passes in both locales. Supabase Cron can invoke the worker with its existing secret, unauthorized calls still return 401, and quote links lead customers to their own requests after Clerk sign-in.

---

## Phase dependencies

```text
Phase 1 ──┬──▶ Phase 2 ──┬──▶ Phase 4
          └──▶ Phase 3 ──┘
```
