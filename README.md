# Event Decor

Event Decor is a Next.js app that uses Supabase Auth for sign-in, Supabase Postgres for application data, and Resend for notification emails.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values below. `.env.local` is ignored by Git.
3. In Supabase, create a project and copy its Project URL and publishable key from **Project Settings → API**. Set `DATABASE_URL` to the project's Postgres connection string. Use the session pooler connection string when direct connections are unavailable (for example, on IPv4-only hosts).
4. Set the Supabase Auth site URL to `http://localhost:3000` and add the local and production callback URLs required by the app to the allowed redirect URLs.
5. Apply the checked-in Drizzle migrations: `npm run db:migrate`.
6. In Resend, create an API key and verify the domain used by `EMAIL_FROM`. Use a sender such as `Events <events@your-verified-domain.com>`.
7. Start the app with `npm run dev`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, used by browser and server auth clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. Never put a secret/service-role key in a `NEXT_PUBLIC_` variable. |
| `DATABASE_URL` | Postgres connection used by Drizzle migrations and server-side queries. |
| `RESEND_API_KEY` | Server-only Resend API key for notification delivery. |
| `EMAIL_FROM` | Verified sender identity, for example `Events <events@example.com>`. |
| `APP_ORIGIN` | Absolute public app origin used to construct links in notification emails. |
| `NOTIFICATION_CRON_SECRET` | Long random bearer token authorizing scheduled notification-worker calls. |

Set the same variables in the production hosting environment. Set `APP_ORIGIN` to the deployed HTTPS origin there. Generate the cron secret with a password manager or `openssl rand -hex 32`; store it as a secret in both the hosting provider and Supabase Vault.

## Scheduled email notifications

The app sends notification emails from its server-side worker at `POST /api/internal/notifications`. The endpoint requires `Authorization: Bearer <NOTIFICATION_CRON_SECRET>` and needs `DATABASE_URL`, `APP_ORIGIN`, `RESEND_API_KEY`, and `EMAIL_FROM` configured. It processes queued notifications and records retries/failures in Postgres.

To run the worker in production:

1. Enable `pg_cron`, `pg_net`, and Vault in the Supabase project.
2. Store the deployed app origin and the same cron secret in Vault as `app-origin` and `notification-cron-secret` (the names referenced by `supabase/cron/notifications.sql`). Do not commit these values.
3. Run `supabase/cron/notifications.sql` in the Supabase SQL editor. It schedules a request every five minutes. Confirm the schedule and HTTP responses in Supabase's cron/net extension logs.

For local testing, call the endpoint with the bearer secret after starting the app. Do not enable the loopback test transport in production; it is only for local notification tests.

## Useful commands

```bash
npm run dev
npm run db:check
npm run db:migrate
npm test
```
